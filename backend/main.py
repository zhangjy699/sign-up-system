from fastapi import FastAPI
from app.routes import router

app = FastAPI(docs_url="/")

# Include router
app.include_router(router)

@app.get("/_health")
def health():
    """
    Returns the health status of the application.

    return: A string "OK" if working
    """
    return "OK"

