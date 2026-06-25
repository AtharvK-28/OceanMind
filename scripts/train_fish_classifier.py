"""
Train a ResNet50-based fish species classifier on the OceanMind image dataset.

Uses transfer learning with heavy data augmentation to handle the small dataset
(2 images per species). Freezes the ResNet50 backbone and trains a new classifier head.

Usage:
    python scripts/train_fish_classifier.py

Outputs:
    data/models/fish_classifier.pt   — trained model state dict
    data/models/fish_classifier_classes.json — class name → index mapping
"""

import json
import os
import re
import sys

import numpy as np
import torch
import torch.nn as nn
from PIL import Image
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms

IMAGE_DIR = os.path.join(os.path.dirname(__file__), "..", "image-data")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "models")
EPOCHS = 40
AUGMENTATIONS_PER_IMAGE = 60
BATCH_SIZE = 16
LR = 1e-3
IMG_SIZE = 224


def parse_species_from_filename(filename: str) -> str:
    """Extract species name from filename like 'IndianMackerel1.jpg' → 'IndianMackerel'."""
    stem = os.path.splitext(filename)[0]
    return re.sub(r"\d+$", "", stem)


class AugmentedFishDataset(Dataset):
    """Dataset that generates multiple augmented views per source image."""

    def __init__(self, image_dir: str, augmentations_per_image: int, transform):
        self.transform = transform
        self.samples = []  # (path, class_idx)
        self.class_names = []
        self.augmentations_per_image = augmentations_per_image

        species_to_paths: dict[str, list[str]] = {}
        for fname in sorted(os.listdir(image_dir)):
            if not fname.lower().endswith((".jpg", ".jpeg", ".png")):
                continue
            species = parse_species_from_filename(fname)
            species_to_paths.setdefault(species, []).append(
                os.path.join(image_dir, fname)
            )

        self.class_names = sorted(species_to_paths.keys())
        class_to_idx = {name: i for i, name in enumerate(self.class_names)}

        for species, paths in species_to_paths.items():
            idx = class_to_idx[species]
            for path in paths:
                for _ in range(augmentations_per_image):
                    self.samples.append((path, idx))

        print(f"Dataset: {len(self.class_names)} classes, "
              f"{len(species_to_paths)} species, "
              f"{sum(len(v) for v in species_to_paths.values())} source images, "
              f"{len(self.samples)} augmented samples")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        img = Image.open(path).convert("RGB")
        img = self.transform(img)
        return img, label


def build_transforms():
    """Heavy augmentation to compensate for small dataset."""
    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(IMG_SIZE, scale=(0.5, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(p=0.3),
        transforms.RandomRotation(30),
        transforms.ColorJitter(brightness=0.4, contrast=0.4, saturation=0.4, hue=0.1),
        transforms.RandomAffine(degrees=15, translate=(0.1, 0.1), scale=(0.85, 1.15)),
        transforms.RandomGrayscale(p=0.1),
        transforms.GaussianBlur(kernel_size=5, sigma=(0.1, 2.0)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        transforms.RandomErasing(p=0.2),
    ])
    return train_transform


def build_model(num_classes: int) -> nn.Module:
    """ResNet50 with frozen backbone and new classifier head."""
    model = models.resnet50(weights="IMAGENET1K_V2")

    for param in model.parameters():
        param.requires_grad = False

    # Unfreeze layer4 for some fine-tuning capacity
    for param in model.layer4.parameters():
        param.requires_grad = True

    model.fc = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(2048, 512),
        nn.ReLU(),
        nn.Dropout(0.2),
        nn.Linear(512, num_classes),
    )
    return model


def train():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    transform = build_transforms()
    dataset = AugmentedFishDataset(IMAGE_DIR, AUGMENTATIONS_PER_IMAGE, transform)

    if len(dataset.class_names) == 0:
        print("ERROR: No images found in", IMAGE_DIR)
        sys.exit(1)

    loader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True,
                        num_workers=0, pin_memory=True)

    num_classes = len(dataset.class_names)
    model = build_model(num_classes).to(device)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)

    trainable_params = [p for p in model.parameters() if p.requires_grad]
    optimizer = torch.optim.AdamW(trainable_params, lr=LR, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)

    print(f"\nTraining {num_classes}-class classifier for {EPOCHS} epochs...")
    print(f"Classes: {dataset.class_names}\n")

    best_acc = 0.0
    best_state = None

    for epoch in range(1, EPOCHS + 1):
        model.train()
        total_loss = 0.0
        correct = 0
        total = 0

        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * images.size(0)
            _, predicted = outputs.max(1)
            correct += predicted.eq(labels).sum().item()
            total += labels.size(0)

        scheduler.step()
        avg_loss = total_loss / total
        acc = 100.0 * correct / total

        if epoch % 5 == 0 or epoch == 1:
            print(f"  Epoch {epoch:3d}/{EPOCHS}  loss={avg_loss:.4f}  acc={acc:.1f}%  lr={scheduler.get_last_lr()[0]:.6f}")

        if acc > best_acc:
            best_acc = acc
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}

    print(f"\nBest training accuracy: {best_acc:.1f}%")

    os.makedirs(MODEL_DIR, exist_ok=True)

    model_path = os.path.join(MODEL_DIR, "fish_classifier.pt")
    torch.save({
        "state_dict": best_state,
        "num_classes": num_classes,
        "class_names": dataset.class_names,
        "img_size": IMG_SIZE,
        "normalize_mean": [0.485, 0.456, 0.406],
        "normalize_std": [0.229, 0.224, 0.225],
    }, model_path)
    print(f"Saved model to {model_path}")

    classes_path = os.path.join(MODEL_DIR, "fish_classifier_classes.json")
    class_map = {name: i for i, name in enumerate(dataset.class_names)}
    with open(classes_path, "w") as f:
        json.dump(class_map, f, indent=2)
    print(f"Saved class map to {classes_path}")

    print(f"\nModel size: {os.path.getsize(model_path) / 1e6:.1f} MB")
    print("Done.")


if __name__ == "__main__":
    train()
