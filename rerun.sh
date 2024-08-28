docker compose -p relay down;
docker compose -p relay -f docker-compose.yaml pull;
docker compose -p relay -f docker-compose.yaml up --build -d --remove-orphans;
