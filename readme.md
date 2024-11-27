version: '3.9'
services:
  keycloak:
    image: quay.io/keycloak/keycloak:22.0.1
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
    ports:
      - "8080:8080"
    command: ["start-dev"]
    volumes:
      - keycloak-data:/opt/keycloak/data/
    networks:
      - mine

networks:
  mine:
    external: true

volumes:
  keycloak-data:
  