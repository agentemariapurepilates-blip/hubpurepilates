"""O que subir e o que apagar: compara o build local com a staging do servidor.

Uso: diferenca.py <dist> <listagem do servidor> <pasta de saida> <caminho remoto da staging>

Le a listagem do listar.ps1 (caminho em base64 + sha256), calcula o sha256 de
cada arquivo do build e escreve em <pasta de saida>:
  lote.sftp   comandos para o sftp: criar pastas, enviar os novos ou
              alterados, apagar os que sairam do build
  resumo.txt  uma linha de numeros, que o deploy-rapido.sh mostra

POR QUE HASH E NAO DATA OU TAMANHO: a data muda a cada build, mesmo com o
arquivo igual, e o tamanho pode coincidir com conteudo diferente. O hash so
muda se o conteudo mudou: os 281 MB de midia, que quase nunca mudam, deixam de
subir a cada deploy.

POR QUE NFC: o macOS guarda nomes com acento decompostos ("a" + til); o que
volta do Windows pode estar composto. Sem normalizar, "Arte pronta.jpeg" ou
"Captura de Tela ... as ..." nunca bateriam e subiriam de novo toda vez.
"""

import base64
import hashlib
import os
import sys
import unicodedata


def nfc(texto: str) -> str:
    return unicodedata.normalize("NFC", texto)


def sha256(caminho: str) -> str:
    h = hashlib.sha256()
    with open(caminho, "rb") as f:
        for bloco in iter(lambda: f.read(1 << 20), b""):
            h.update(bloco)
    return h.hexdigest()


def aspas(texto: str) -> str:
    """Caminho entre aspas para o sftp, escapando o que o sftp interpreta."""
    return '"' + texto.replace("\\", "\\\\").replace('"', '\\"') + '"'


def main() -> None:
    dist, listagem, saida, remoto = sys.argv[1:5]
    remoto = remoto.rstrip("/")

    no_servidor: dict[str, tuple[str, str]] = {}  # nfc -> (nome real, hash)
    with open(listagem, encoding="ascii") as f:
        for linha in f:
            linha = linha.strip()
            if not linha or "\t" not in linha:
                continue
            b64, h = linha.split("\t", 1)
            real = base64.b64decode(b64).decode("utf-8")
            no_servidor[nfc(real)] = (real, h.strip().lower())

    locais: dict[str, str] = {}  # nfc -> caminho local
    for raiz, _, arquivos in os.walk(dist):
        for nome in arquivos:
            # Lixo do Finder do macOS que vem de public/ para o build. Nao serve
            # para nada no servidor, e o deploy.sh antigo publicava.
            if nome == ".DS_Store":
                continue
            completo = os.path.join(raiz, nome)
            rel = os.path.relpath(completo, dist).replace(os.sep, "/")
            locais[nfc(rel)] = completo

    subir = sorted(r for r, c in locais.items() if r not in no_servidor or no_servidor[r][1] != sha256(c))
    apagar = sorted(no_servidor[r][0] for r in no_servidor if r not in locais)

    pastas = sorted({os.path.dirname(r) for r in subir if os.path.dirname(r)}, key=lambda p: (p.count("/"), p))
    todas = []
    for p in pastas:  # cada nivel, para o sftp conseguir criar a mais funda
        partes = p.split("/")
        for i in range(1, len(partes) + 1):
            nivel = "/".join(partes[:i])
            if nivel not in todas:
                todas.append(nivel)

    with open(os.path.join(saida, "lote.sftp"), "w", encoding="utf-8") as f:
        for p in todas:
            # "-" antes do comando: pasta que ja existe nao interrompe o lote.
            f.write(f"-mkdir {aspas(remoto + '/' + p)}\n")
        for r in subir:
            f.write(f"put {aspas(locais[r])} {aspas(remoto + '/' + r)}\n")
        for r in apagar:
            f.write(f"rm {aspas(remoto + '/' + r)}\n")

    mb = sum(os.path.getsize(locais[r]) for r in subir) / (1 << 20)
    total = sum(os.path.getsize(c) for c in locais.values()) / (1 << 20)
    with open(os.path.join(saida, "resumo.txt"), "w", encoding="utf-8") as f:
        f.write(f"{len(subir)} {mb:.1f} {len(apagar)} {len(locais)} {total:.1f}\n")


if __name__ == "__main__":
    main()
