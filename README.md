# Bookshelf

A small full-stack CRUD app: a reading list manager.

- **frontend**: static HTML/JS served by nginx (port 8080), proxies `/api` to the backend
- **backend**: Node.js + Express REST API
- **db**: MySQL 8 (data kept in a Docker volume)

## Run

```bash
docker compose up --build
```

Open http://localhost:8080

## Stop

```bash
docker compose down        # keep data
docker compose down -v     # also delete the database volume
```

## API

| Method | Path | Action |
|---|---|---|
| GET | /api/books | list books |
| POST | /api/books | add a book |
| PUT | /api/books/:id | update a book |
| DELETE | /api/books/:id | delete a book |
