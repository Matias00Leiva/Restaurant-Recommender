
FROM denoland/deno:2.9.6

WORKDIR /app

COPY deno.json deno.lock ./
COPY src ./src

RUN deno cache src/server.ts

# Allow the hosting platform to reach the API.
ENV HOST=0.0.0.0

EXPOSE 8000

CMD ["deno", "task", "start"]
