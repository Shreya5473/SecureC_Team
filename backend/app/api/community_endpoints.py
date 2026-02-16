"""
Community API endpoints for threat intelligence sharing and WAF rules.
"""
from fastapi import APIRouter, HTTPException
from typing import Optional, List
from pydantic import BaseModel
from app.db.supabase_client import supabase
from datetime import datetime

router = APIRouter()


# Pydantic models for request/response
class ThreatSubmission(BaseModel):
    title: str
    description: str
    category: str
    example_payload: Optional[str] = None
    mitigation: Optional[str] = None
    confidence: float = 0.7


class RuleSubmission(BaseModel):
    name: str
    description: str
    category: str
    rule_type: str  # 'input_guard', 'output_guard', 'behavior_guard'
    rule_config: dict


class UpvoteRequest(BaseModel):
    item_id: str
    item_type: str  # 'threat' or 'rule'


# ===== TRENDING THREATS ENDPOINTS =====

@router.get("/community/threats")
async def get_trending_threats(limit: int = 10):
    """
    Get trending threats ordered by upvotes.
    
    Args:
        limit: Maximum number of threats to return (default 10)
    
    Returns:
        List of threat intelligence items
    """
    try:
        response = supabase.table("community_threats") \
            .select("*") \
            .order("upvotes", desc=True) \
            .limit(limit) \
            .execute()
        
        return {
            "count": len(response.data),
            "threats": response.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch threats: {str(e)}")


@router.post("/community/threats")
async def submit_threat(threat: ThreatSubmission):
    """
    Submit a new threat to the community database.
    
    Args:
        threat: Threat submission data
    
    Returns:
        Created threat record
    """
    try:
        # Validate confidence score
        if not 0 <= threat.confidence <= 1:
            raise HTTPException(status_code=400, detail="Confidence must be between 0 and 1")
        
        # Validate category
        valid_categories = [
            "Injection", "XSS", "Authentication", "Authorization", 
            "File Access", "SSRF", "Deserialization", "AI Security",
            "Data Privacy", "Cryptography", "Configuration", "Other"
        ]
        if threat.category not in valid_categories:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}"
            )
        
        data = {
            "title": threat.title,
            "description": threat.description,
            "category": threat.category,
            "confidence": threat.confidence,
            "example_payload": threat.example_payload,
            "mitigation": threat.mitigation,
            "upvotes": 0,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        response = supabase.table("community_threats").insert(data).execute()
        
        return {
            "success": True,
            "threat": response.data[0] if response.data else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit threat: {str(e)}")


@router.get("/community/threats/{threat_id}")
async def get_threat_details(threat_id: str):
    """
    Get detailed information about a specific threat.
    
    Args:
        threat_id: UUID of the threat
    
    Returns:
        Threat details
    """
    try:
        response = supabase.table("community_threats") \
            .select("*") \
            .eq("id", threat_id) \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Threat not found")
        
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch threat: {str(e)}")


# ===== SHARED WAF RULES ENDPOINTS =====

@router.get("/community/rules")
async def get_waf_rules(limit: int = 10, rule_type: Optional[str] = None):
    """
    Get shared WAF rules ordered by upvotes.
    
    Args:
        limit: Maximum number of rules to return (default 10)
        rule_type: Optional filter by rule type
    
    Returns:
        List of WAF rules
    """
    try:
        query = supabase.table("community_rules").select("*")
        
        if rule_type:
            query = query.eq("rule_type", rule_type)
        
        response = query.order("upvotes", desc=True).limit(limit).execute()
        
        return {
            "count": len(response.data),
            "rules": response.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch rules: {str(e)}")


@router.post("/community/rules")
async def submit_rule(rule: RuleSubmission):
    """
    Submit a new WAF rule to the community database.
    
    Args:
        rule: Rule submission data
    
    Returns:
        Created rule record
    """
    try:
        # Validate rule type
        valid_types = ["input_guard", "output_guard", "behavior_guard"]
        if rule.rule_type not in valid_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid rule_type. Must be one of: {', '.join(valid_types)}"
            )
        
        # Validate category
        valid_categories = [
            "Injection Prevention", "XSS Prevention", "Data Privacy",
            "Rate Limiting", "File Security", "AI Security",
            "Content Safety", "Input Validation", "Other"
        ]
        if rule.category not in valid_categories:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}"
            )
        
        data = {
            "name": rule.name,
            "description": rule.description,
            "category": rule.category,
            "rule_type": rule.rule_type,
            "rule_config": rule.rule_config,
            "upvotes": 0,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        response = supabase.table("community_rules").insert(data).execute()
        
        return {
            "success": True,
            "rule": response.data[0] if response.data else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit rule: {str(e)}")


# ===== UPVOTE ENDPOINTS =====

@router.post("/community/upvote")
async def upvote_item(request: UpvoteRequest):
    """
    Upvote a threat or rule.
    
    Args:
        request: Upvote request with item_id and item_type
    
    Returns:
        Updated item with new upvote count
    """
    try:
        table_name = "community_threats" if request.item_type == "threat" else "community_rules"
        
        if request.item_type not in ["threat", "rule"]:
            raise HTTPException(status_code=400, detail="item_type must be 'threat' or 'rule'")
        
        # Get current upvote count
        response = supabase.table(table_name) \
            .select("upvotes") \
            .eq("id", request.item_id) \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"{request.item_type.capitalize()} not found")
        
        current_upvotes = response.data[0].get("upvotes", 0)
        
        # Increment upvotes
        update_response = supabase.table(table_name) \
            .update({
                "upvotes": current_upvotes + 1,
                "updated_at": datetime.utcnow().isoformat()
            }) \
            .eq("id", request.item_id) \
            .execute()
        
        return {
            "success": True,
            "item": update_response.data[0] if update_response.data else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upvote: {str(e)}")


# ===== ANALYTICS ENDPOINTS =====

@router.get("/community/analytics/categories")
async def get_threat_categories_analytics():
    """
    Get threat distribution by category for visualization.
    
    Returns:
        Category counts for chart rendering
    """
    try:
        response = supabase.table("community_threats") \
            .select("category") \
            .execute()
        
        # Count threats per category
        category_counts = {}
        for threat in response.data:
            category = threat.get("category", "Other")
            category_counts[category] = category_counts.get(category, 0) + 1
        
        # Format for chart
        chart_data = [
            {"category": category, "count": count}
            for category, count in sorted(category_counts.items(), key=lambda x: x[1], reverse=True)
        ]
        
        return {
            "total_threats": len(response.data),
            "categories": chart_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")


@router.get("/community/analytics/trends")
async def get_community_trends():
    """
    Get overall community statistics.
    
    Returns:
        Summary statistics for the community
    """
    try:
        threats_response = supabase.table("community_threats").select("*").execute()
        rules_response = supabase.table("community_rules").select("*").execute()
        
        total_upvotes_threats = sum(t.get("upvotes", 0) for t in threats_response.data)
        total_upvotes_rules = sum(r.get("upvotes", 0) for r in rules_response.data)
        
        return {
            "total_threats": len(threats_response.data),
            "total_rules": len(rules_response.data),
            "total_upvotes": total_upvotes_threats + total_upvotes_rules,
            "avg_threat_confidence": sum(t.get("confidence", 0) for t in threats_response.data) / len(threats_response.data) if threats_response.data else 0,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch trends: {str(e)}")
