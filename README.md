# 🚀 How to run Cafe Order (Docker)

## 1️⃣ Install Docker Desktop

### Download and install:

https://www.docker.com/products/docker-desktop/

### Make sure Docker is running.

## 2️⃣ Clone the repository

```bash


git clone https://github.com/amarkosovac11/cafe-order

cd cafe-order
```

## 3️⃣ Start everything (make sure Docker Desktop is running)

```bash
docker compose down -v
docker compose up --build
```

## Routes

### Frontend:

```bash
http://localhost:5173
```

### Customer

```bash
/t/:tableId – Table ordering page
/t/:tableId?token=xxxx – Table with token validation
/demo/table - Demo page for tables
```

### Waiter

```bash
/waiter – Waiter dashboard
/waiter/:waiterId – Personal waiter page
```


Backend:

```bash
http://localhost:4000/health
```

## 5️⃣ Stop it

Press Ctrl + C 
or
```bash
docker compose down
```
