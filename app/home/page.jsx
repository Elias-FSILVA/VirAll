"use client";
import { supabase } from "../../api/supabaseClient";
import { useEffect, useState } from "react";
import "@/app/index.css";
import Header from "../../components/Header";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [menuAberto, setMenuAberto] = useState(null);
  const [postEditandoId, setPostEditandoId] = useState(null);
  const [descricaoEditada, setDescricaoEditada] = useState("");
  const [modoCriacaoAtivo, setModoCriacaoAtivo] = useState(false);
  const [user, setUser] = useState(null);

  // Pega usuário logado
  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  // Carrega posts e ativa realtime
  useEffect(() => {
    async function carregaPosts() {
      const { data, error } = await supabase.from("posts").select("*").order("id", { ascending: false });
      if (error) console.log(error);
      else setPosts(data);
    }
    carregaPosts();

    // Realtime
    const channel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPosts((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setPosts((prev) =>
              prev.map((p) => (p.id === payload.new.id ? payload.new : p))
            );
          } else if (payload.eventType === "DELETE") {
            setPosts((prev) => prev.filter((p) => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function inserirPost(e) {
    e.preventDefault();
    if (!novoTitulo.trim() && !novaDescricao.trim()) return;

    const { data, error } = await supabase.from("posts").insert([
      {
        titulo: novoTitulo,
        descricao: novaDescricao,
        user_id: user?.id, // vincula post ao autor
      },
    ]);

    if (error) {
      console.log(error);
    } else {
      setNovoTitulo("");
      setNovaDescricao("");
      setModoCriacaoAtivo(false);
    }
  }

  async function deletarPost(id) {
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) console.log(error);
  }

  function editarPost(id, descricaoAtual) {
    setPostEditandoId(id);
    setDescricaoEditada(descricaoAtual);
    setMenuAberto(null);
  }

  async function salvarEdicao(id) {
    const { error } = await supabase
      .from("posts")
      .update({ descricao: descricaoEditada })
      .eq("id", id);

    if (error) console.log(error);
    else {
      setPostEditandoId(null);
      setDescricaoEditada("");
    }
  }

  return (
    <div className="container">
      {!modoCriacaoAtivo ? (
        <button
          onClick={() => setModoCriacaoAtivo(true)}
          className="btn-criar-post"
        >
          Criar Post
        </button>
      ) : (
        <form onSubmit={inserirPost} className="formulario">
          <div className="campo">
            <input
              className="campo-titulo"
              type="text"
              placeholder="Digite um título do post (opcional)"
              value={novoTitulo}
              onChange={(e) => setNovoTitulo(e.target.value)}
            />
          </div>
          <div className="campo">
            <textarea
              className="campo-descricao"
              placeholder="Digite sua descrição..."
              value={novaDescricao}
              onChange={(e) => setNovaDescricao(e.target.value)}
            />
          </div>
          <div className="campo">
            <button type="submit">Publicar</button>
            <button
              type="button"
              onClick={() => {
                setModoCriacaoAtivo(false);
                setNovoTitulo("");
                setNovaDescricao("");
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <ul className="lista-posts">
        {posts?.map((item) => (
          <li key={item.id} className="card-post">
            <div className="post-header">
              <h2 className="titulo-post">{item.titulo}</h2>

              {user?.id === item.user_id && ( // só o autor vê menu
                <div className="menu-container">
                  <button
                    className="menu-toggle"
                    onClick={() =>
                      setMenuAberto(menuAberto === item.id ? null : item.id)
                    }
                  >
                    ⋮
                  </button>
                  {menuAberto === item.id && (
                    <div className="menu-opcoes">
                      <button
                        onClick={() => editarPost(item.id, item.descricao)}
                      >
                        Editar
                      </button>
                      <button onClick={() => deletarPost(item.id)}>
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {postEditandoId === item.id ? (
              <div className="edicao-post">
                <textarea
                  value={descricaoEditada}
                  onChange={(e) => setDescricaoEditada(e.target.value)}
                />
                <button onClick={() => salvarEdicao(item.id)}>Salvar</button>
                <button onClick={() => setPostEditandoId(null)}>Cancelar</button>
              </div>
            ) : (
              <p className="descricao-post">{item.descricao}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
