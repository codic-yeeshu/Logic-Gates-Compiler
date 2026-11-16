"""HTTP adapter. The compiler has no dependency on this module."""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, StrictBool, StrictStr, ConfigDict
from compiler.pipeline import compile_source

app = FastAPI(title="Logic Gates Compiler", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173",
    ).split(","),
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)


class CompileRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    source: StrictStr
    optimization: StrictBool = True


@app.get("/api/health")
def health():
    return {"status": "ok", "schema_version": "1.0"}


@app.post("/api/compile")
def compile_endpoint(request: CompileRequest):
    return compile_source(request.source, request.optimization)
