# 🐳 Oracle XE 21c Setup with Docker

This guide walks through running Oracle Database Express Edition (XE) in Docker, connecting to it, and performing basic database operations.

---

## 📦 1. Pull Oracle XE Image

```bash
docker container create -it --name oracle-wed -p 3331:1521 -e ORACLE_PWD=welcome123 container-registry.oracle.com/database/express:21.3.0-xe


docker exec -it oracle-web bash


sqlplus system/welcome123@//localhost:1521/XEPDB1