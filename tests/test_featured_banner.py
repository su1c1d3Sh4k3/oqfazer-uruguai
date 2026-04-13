"""
Testes: Banner de Destaques (Featured Carousel)
Valida que o sistema de destaques funciona end-to-end:
marcar como destaque, atribuir ordem, desmarcar, e verificar persistência.
"""

import uuid
import httpx
import pytest
from conftest import (
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    auth_headers,
    service_headers,
    cleanup_test_place,
)
from test_places_crud import make_place


@pytest.fixture
def featured_places(admin_session):
    """Cria 3 places para testar featured ordering."""
    ids = [f"test-feat-{i}-{uuid.uuid4().hex[:6]}" for i in range(3)]
    for i, pid in enumerate(ids):
        place = make_place(pid, name=f"Destaque Teste {i + 1}")
        httpx.post(
            f"{SUPABASE_URL}/rest/v1/places",
            headers=auth_headers(admin_session["access_token"]),
            json=place,
            timeout=30,
        )
    yield ids
    for pid in ids:
        cleanup_test_place(pid)


class TestFeaturedSystem:
    """Testa o sistema completo de destaques."""

    def test_mark_as_featured_with_order(self, admin_session, featured_places):
        """Marcar places como destaque com ordem → persiste no banco."""
        for i, pid in enumerate(featured_places):
            r = httpx.patch(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{pid}",
                headers=auth_headers(admin_session["access_token"]),
                json={"featured": True, "featured_order": i + 1},
                timeout=30,
            )
            assert r.status_code in (200, 204), f"Mark featured falhou: {r.text}"

        # Verifica que todos são featured com ordem correta
        for i, pid in enumerate(featured_places):
            r = httpx.get(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{pid}&select=featured,featured_order,name",
                headers=service_headers(),
                timeout=30,
            )
            row = r.json()[0]
            assert row["featured"] is True, f"Place {pid} não está featured!"
            assert row["featured_order"] == i + 1, f"Ordem errada! esperava {i + 1}, got {row['featured_order']}"
            assert row["name"].startswith("Destaque Teste"), f"Nome foi corrompido: {row['name']}"

    def test_featured_query_returns_correct_places(self, admin_session, featured_places):
        """Query de featured places retorna apenas os marcados, ordenados."""
        # Marca apenas 2 dos 3 como featured
        httpx.patch(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{featured_places[0]}",
            headers=auth_headers(admin_session["access_token"]),
            json={"featured": True, "featured_order": 2},
            timeout=30,
        )
        httpx.patch(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{featured_places[1]}",
            headers=auth_headers(admin_session["access_token"]),
            json={"featured": True, "featured_order": 1},
            timeout=30,
        )
        # Terceiro NÃO é featured

        # Query como anônimo (simula o que Index.tsx faz)
        r = httpx.get(
            f"{SUPABASE_URL}/rest/v1/places?featured=eq.true&select=id,name,featured_order&order=featured_order.asc",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            },
            timeout=30,
        )
        assert r.status_code == 200
        featured = r.json()
        # Deve incluir os 2 marcados (pode ter outros do banco se houver)
        featured_ids = [f["id"] for f in featured]
        assert featured_places[0] in featured_ids
        assert featured_places[1] in featured_ids
        assert featured_places[2] not in featured_ids

    def test_reorder_featured(self, admin_session, featured_places):
        """Reordenar destaques (drag-drop) atualiza featured_order sem apagar dados."""
        # Marca todos como featured
        for i, pid in enumerate(featured_places):
            httpx.patch(
                f"{SUPABASE_URL}/rest/v1/places?id=eq.{pid}",
                headers=auth_headers(admin_session["access_token"]),
                json={"featured": True, "featured_order": i + 1},
                timeout=30,
            )

        # Reordena: move #3 para #1 (simula drag-drop no AdminDisplayManager)
        httpx.patch(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{featured_places[2]}",
            headers=auth_headers(admin_session["access_token"]),
            json={"featured_order": 1},
            timeout=30,
        )
        httpx.patch(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{featured_places[0]}",
            headers=auth_headers(admin_session["access_token"]),
            json={"featured_order": 2},
            timeout=30,
        )
        httpx.patch(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{featured_places[1]}",
            headers=auth_headers(admin_session["access_token"]),
            json={"featured_order": 3},
            timeout=30,
        )

        # Verifica nova ordem
        r = httpx.get(
            f"{SUPABASE_URL}/rest/v1/places?id=in.({','.join(featured_places)})&select=id,featured_order,name&order=featured_order.asc",
            headers=service_headers(),
            timeout=30,
        )
        rows = r.json()
        assert rows[0]["id"] == featured_places[2], "Reorder falhou!"
        assert rows[0]["featured_order"] == 1
        assert rows[1]["id"] == featured_places[0]
        assert rows[2]["id"] == featured_places[1]
        # Nomes intactos
        for row in rows:
            assert row["name"].startswith("Destaque Teste"), f"Nome corrompido: {row['name']}"

    def test_remove_featured_preserves_place_data(self, admin_session, featured_places):
        """Remover destaque não apaga dados do place."""
        pid = featured_places[0]
        # Marca e depois desmarca
        httpx.patch(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{pid}",
            headers=auth_headers(admin_session["access_token"]),
            json={"featured": True, "featured_order": 1},
            timeout=30,
        )
        httpx.patch(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{pid}",
            headers=auth_headers(admin_session["access_token"]),
            json={"featured": False, "featured_order": None},
            timeout=30,
        )

        # Verifica que place mantém todos os dados
        r = httpx.get(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{pid}&select=*",
            headers=service_headers(),
            timeout=30,
        )
        row = r.json()[0]
        assert row["featured"] is False
        assert row["featured_order"] is None
        assert row["name"] == "Destaque Teste 1", f"Nome corrompido: {row['name']}"
        assert row["description"] != "", "Descrição foi apagada!"
        assert row["category"] == "Restaurantes"


class TestViewsAndMetrics:
    """Testa que visualizações e métricas são contabilizadas."""

    def test_rpc_increment_works_for_authenticated(self, user_session, featured_places):
        """Usuário autenticado consegue incrementar access_count via RPC."""
        pid = featured_places[0]

        r0 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{pid}&select=access_count",
            headers=service_headers(),
            timeout=30,
        )
        before = r0.json()[0]["access_count"]

        r = httpx.post(
            f"{SUPABASE_URL}/rest/v1/rpc/increment_place_metric",
            headers=auth_headers(user_session["access_token"]),
            json={"p_place_id": pid, "p_metric": "access_count"},
            timeout=30,
        )
        assert r.status_code in (200, 204), f"RPC falhou: {r.status_code} {r.text}"

        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{pid}&select=access_count",
            headers=service_headers(),
            timeout=30,
        )
        after = r2.json()[0]["access_count"]
        assert after == before + 1

    def test_rpc_increment_works_for_anon(self, featured_places):
        """Anônimo consegue incrementar access_count via RPC (GRANT to anon)."""
        pid = featured_places[0]

        r0 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{pid}&select=access_count",
            headers=service_headers(),
            timeout=30,
        )
        before = r0.json()[0]["access_count"]

        r = httpx.post(
            f"{SUPABASE_URL}/rest/v1/rpc/increment_place_metric",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                "Content-Type": "application/json",
            },
            json={"p_place_id": pid, "p_metric": "access_count"},
            timeout=30,
        )
        assert r.status_code in (200, 204), f"RPC anon falhou: {r.status_code} {r.text}"

        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{pid}&select=access_count",
            headers=service_headers(),
            timeout=30,
        )
        after = r2.json()[0]["access_count"]
        assert after == before + 1

    def test_rpc_highlight_click_count(self, user_session, featured_places):
        """highlight_click_count incrementa (simula clique no carousel de destaques)."""
        pid = featured_places[0]

        r0 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{pid}&select=highlight_click_count",
            headers=service_headers(),
            timeout=30,
        )
        before = r0.json()[0]["highlight_click_count"]

        httpx.post(
            f"{SUPABASE_URL}/rest/v1/rpc/increment_place_metric",
            headers=auth_headers(user_session["access_token"]),
            json={"p_place_id": pid, "p_metric": "highlight_click_count"},
            timeout=30,
        )

        r2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/places?id=eq.{pid}&select=highlight_click_count",
            headers=service_headers(),
            timeout=30,
        )
        after = r2.json()[0]["highlight_click_count"]
        assert after == before + 1
