FROM alpine:3.19

ARG OPENCODE_VERSION=1.18.3

# Install dependencies
RUN apk add --no-cache curl ca-certificates

# Download opencode binary
RUN curl -fsSL "https://github.com/anomalyco/opencode/releases/download/v${OPENCODE_VERSION}/opencode_${OPENCODE_VERSION}_linux_amd64.tar.gz" \
    | tar xz -C /usr/local/bin opencode

# Create non-root user
RUN adduser -D -s /bin/sh opencode

# Working directory for projects
RUN mkdir -p /projects && chown opencode:opencode /projects

USER opencode
WORKDIR /projects

EXPOSE 4096

# Default: serve on all interfaces (accessible from outside container)
CMD ["opencode", "serve", "--port", "4096", "--hostname", "0.0.0.0"]
