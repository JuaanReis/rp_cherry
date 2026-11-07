"""Cria e verifica o banco SQLite sem iniciar o servidor."""

from backend.core.config import load_environment


def main():
    load_environment()

    # O diretório configurado no .env precisa ser carregado antes do banco.
    from backend.db import session as db
    from backend.db.schema import initialize

    initialize(reset_sessions=False)
    with db.connection() as conn:
        result = [row[0] for row in conn.execute("PRAGMA quick_check")]
        if result != ["ok"]:
            raise RuntimeError("Falha na verificação do SQLite: " + "; ".join(result))
        products = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
        categories = conn.execute("SELECT COUNT(*) FROM categories").fetchone()[0]

    print(f"Banco SQLite pronto: {db.DB_PATH}")
    print(f"Integridade: ok | Produtos: {products} | Categorias: {categories}")


if __name__ == "__main__":
    main()
