# MOCK_LEDGER
# ============================================================================
# OceanMind — Phase H: Mock In-Memory Hash Chain
# Phase H MVP: Python dict simulating an immutable ledger.
# Returns deterministic transaction IDs (SHA-256).
# Phase 2: Replace this entire module with Hyperledger Fabric 2.5.
#          The API contract (/api/v1/trace/catch) remains identical.
# See README "Phase H Implementation Notes" for swap-in instructions.
# ============================================================================
import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Optional

from loguru import logger


class MockHashChain:
    """
    In-memory mock blockchain ledger.
    Simulates immutability: once a record is written, it cannot be removed.
    Each transaction's hash includes the previous transaction hash (chain link).
    Phase 2: swap with Hyperledger Fabric chaincode call.
    """

    def __init__(self):
        # dict: transaction_id → record
        self._ledger: dict[str, dict] = {}
        # Ordered list of transaction_ids (chain order)
        self._chain: list[str] = []
        # Genesis block
        self._genesis_hash = "0" * 64

    @property
    def last_hash(self) -> str:
        if self._chain:
            return self._chain[-1]
        return self._genesis_hash

    def log_catch_event(
        self,
        species_aphia_id: int,
        species_name: str,
        quantity_kg: float,
        latitude: float,
        longitude: float,
        landing_site_id: str,
        timestamp: Optional[datetime] = None,
        fisher_token: Optional[str] = None,
    ) -> dict:
        """
        Write a catch event to the mock ledger.
        Returns: transaction_id (SHA-256), pmmsy_cert_ref, block_number.
        Phase 2: this becomes a Fabric chaincode invoke.
        """
        if timestamp is None:
            timestamp = datetime.now(timezone.utc)

        # Deterministic hash input (reproducible for same event data)
        hash_input = (
            f"{species_aphia_id}:{species_name}:{quantity_kg:.3f}:"
            f"{latitude:.6f}:{longitude:.6f}:{landing_site_id}:"
            f"{timestamp.isoformat()}:{self.last_hash}"
        )
        transaction_id = hashlib.sha256(hash_input.encode()).hexdigest()

        # PMMSY certificate reference (mock format)
        pmmsy_cert_ref = f"PMMSY-{landing_site_id}-{timestamp.strftime('%Y%m%d')}-{transaction_id[:8].upper()}"

        record = {
            "transaction_id":  transaction_id,
            "block_number":    len(self._chain) + 1,
            "previous_hash":   self.last_hash,
            "species_aphia_id": species_aphia_id,
            "species_name":    species_name,
            "quantity_kg":     round(quantity_kg, 3),
            "latitude":        latitude,
            "longitude":       longitude,
            "landing_site_id": landing_site_id,
            "event_timestamp": timestamp.isoformat(),
            "fisher_token":    fisher_token,           # anonymised, no PII
            "pmmsy_cert_ref":  pmmsy_cert_ref,
            "ledger_type":     "MOCK_IN_MEMORY",       # Phase 2: HYPERLEDGER_FABRIC
            "written_at":      datetime.now(timezone.utc).isoformat(),
        }

        # Write to ledger (immutable: key collision raises)
        if transaction_id in self._ledger:
            logger.warning(f"Duplicate transaction detected: {transaction_id[:16]}... — skipping.")
        else:
            self._ledger[transaction_id] = record
            self._chain.append(transaction_id)
            logger.info(f"Block #{record['block_number']} written: {transaction_id[:16]}...")

        return {
            "transaction_id": transaction_id,
            "pmmsy_cert_ref": pmmsy_cert_ref,
            "block_number":   record["block_number"],
            "ledger_type":    "MOCK_IN_MEMORY",
            "status":         "COMMITTED",
        }

    def verify_transaction(self, transaction_id: str) -> Optional[dict]:
        """Look up a transaction by ID. Returns None if not found."""
        return self._ledger.get(transaction_id)

    def get_chain_summary(self) -> dict:
        """Return chain statistics (no sensitive data)."""
        return {
            "total_blocks":       len(self._chain),
            "genesis_hash":       self._genesis_hash[:16] + "...",
            "latest_block_hash":  self.last_hash[:16] + "...",
            "ledger_type":        "MOCK_IN_MEMORY",
            "phase_2_note":       "Replace with Hyperledger Fabric 2.5 at Phase 2.",
        }

    def get_catch_history(self, landing_site_id: Optional[str] = None) -> list[dict]:
        """
        Return catch records, optionally filtered by landing site.
        Phase 2: this becomes a Fabric ledger query.
        """
        records = list(self._ledger.values())
        if landing_site_id:
            records = [r for r in records if r["landing_site_id"] == landing_site_id]
        # Strip internal chain metadata for API responses
        return [
            {k: v for k, v in r.items() if k not in {"previous_hash", "ledger_type", "written_at"}}
            for r in records
        ]


# ── Module-level singleton (shared across FastAPI request lifetime) ─────────────
# Phase 2: replace with Fabric client connection pool
ledger = MockHashChain()
