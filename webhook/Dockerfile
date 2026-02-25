FROM alpine:3.20

RUN apk add --no-cache git bash curl docker-cli docker-cli-compose

# Install webhook
RUN curl -L -o /tmp/webhook.tar.gz \
    "https://github.com/adnanh/webhook/releases/download/2.8.2/webhook-linux-amd64.tar.gz" && \
    tar -xzf /tmp/webhook.tar.gz -C /usr/local/bin --strip-components=1 && \
    rm /tmp/webhook.tar.gz

EXPOSE 9000

ENTRYPOINT ["webhook", "-hooks", "/etc/webhook/hooks.json", "-verbose", "-hotreload"]
