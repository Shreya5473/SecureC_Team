#!/usr/bin/env python3
"""
Clean test data from Supabase vulnerabilities table
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def clean_test_data():
    """Delete all test records from vulnerabilities table"""
    try:
        # Initialize Supabase client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Get current count
        response = supabase.table("vulnerabilities").select("*", count="exact").execute()
        initial_count = response.count
        print(f"📊 Current records in vulnerabilities table: {initial_count}")
        
        if initial_count == 0:
            print("✅ Table is already empty!")
            return
        
        # Show the records that will be deleted
        print("\n🗑️  Records to be deleted:")
        for record in response.data:
            print(f"  - ID: {record['id'][:8]}... | Created: {record['created_at']} | Risk: {record.get('risk', 'N/A')}")
        
        # First, delete all alerts (foreign key constraint)
        print(f"\n🧹 Step 1: Deleting alerts...")
        try:
            alerts_response = supabase.table("alerts").select("*", count="exact").execute()
            alerts_count = alerts_response.count
            if alerts_count > 0:
                supabase.table("alerts").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
                print(f"   ✅ Deleted {alerts_count} alerts")
            else:
                print(f"   ℹ️  No alerts to delete")
        except Exception as e:
            print(f"   ⚠️  Alerts table might not exist or is already empty: {e}")
        
        # Delete all vulnerabilities
        print(f"\n🧹 Step 2: Deleting {initial_count} vulnerabilities...")
        delete_response = supabase.table("vulnerabilities").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        
        # Verify deletion
        final_response = supabase.table("vulnerabilities").select("*", count="exact").execute()
        final_count = final_response.count
        
        print(f"\n✅ Deletion complete!")
        print(f"📊 Records remaining: {final_count}")
        print(f"🎯 Deleted: {initial_count - final_count} records")
        
        if final_count == 0:
            print("\n✨ Supabase vulnerabilities table is now clean and ready for fresh data!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise

if __name__ == "__main__":
    print("🚀 SecureC - Supabase Data Cleanup\n")
    clean_test_data()
