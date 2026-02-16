from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import endpoints
from app.api import internal
from app.api import slack_dm_endpoint
from app.api import waf_endpoints
from app.api import community_endpoints

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(endpoints.router, prefix=settings.API_V1_STR)
app.include_router(internal.router)
app.include_router(slack_dm_endpoint.router, prefix=settings.API_V1_STR)
app.include_router(waf_endpoints.router, prefix=settings.API_V1_STR)
app.include_router(community_endpoints.router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "Sentinel Backend Operational", "docs": "/docs"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
