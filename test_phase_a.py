import os
from dotenv import load_dotenv

load_dotenv()
os.environ["POSTGRES_PASSWORD"] = "postgres"

from backend.ingestion.argo_pipeline import ArgoPipeline
from backend.ingestion.incois_pipeline import IncoisPipeline
from backend.processing.data_bubbles import DataBubbleManager

def run_test():
    print("Initializing DataBubbleManager...")
    bubble_mgr = DataBubbleManager()
    
    print("Testing ARGO Pipeline...")
    argo = ArgoPipeline()
    argo_df = argo.fetch_recent_profiles()
    argo_df = bubble_mgr.assign_bubbles(argo_df, "argo_profiles")
    argo.ingest_to_db(argo_df)
    print(f"Ingested {len(argo_df)} ARGO profiles.")
    
    print("Testing INCOIS Pipeline...")
    incois = IncoisPipeline()
    incois_df = incois.fetch_recent_composites()
    incois_df = bubble_mgr.assign_bubbles(incois_df, "incois_sst")
    incois.ingest_to_db(incois_df)
    print(f"Ingested {len(incois_df)} INCOIS composites.")
    
    print("Phase A tests completed successfully!")

if __name__ == "__main__":
    run_test()
