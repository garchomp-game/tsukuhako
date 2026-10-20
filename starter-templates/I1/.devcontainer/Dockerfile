FROM postgres:18.6-bookworm@sha256:afc7e2d441324c0388fa80c3d24f733b4194a4eb7f47dd8ee2b08eb1a24a647c

# The image already contains psql, bash and the core shell tools. No host Node,
# package manager, extra repository or floating package install is needed.
RUN groupadd --gid 1000 vscode \
    && useradd --uid 1000 --gid 1000 --create-home --shell /bin/bash vscode \
    && mkdir -p /workspace \
    && chown vscode:vscode /workspace
USER vscode
WORKDIR /workspace
ENTRYPOINT []
CMD ["sleep", "infinity"]
