"use client";
import { supabase } from "../../api/supabaseClient";
import { useEffect, useState } from "react";
import style from "";
import Header from "../../components/Header";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [menuAberto, setMenuAberto] = useState(null);
  const [postEditandoId, setPostEditandoId] = useState(null);
  const [descricaoEditada, setDescricaoEditada] = useState("");
  const [modoCriacaoAtivo, setModoCriacaoAtivo] = useState(false);


  useEffect(() => {
    async function carregaPosts() {
      const { data, error } = await supabase.from("posts").select("*");

      if (error) {
        console.log(error);
      } else {
        setPosts(data);
      }
    }
    carregaPosts();
  }, []);

  async function inserirPost(e) {
    e.preventDefault();

    if (!novoTitulo.trim() && !novaDescricao.trim()) return;

    const { data, error } = await supabase
      .from("posts")
      .insert([{ titulo: novoTitulo, descricao: novaDescricao }]);

    if (error) {
      console.log(error);
    } else {
      setPosts((postsAnteriores) => [...postsAnteriores, ...data]);
      setNovoTitulo("");
      setNovaDescricao("");
      setModoCriacaoAtivo(false); // Esconde o formulário
    }
  }


  async function deletarPost(id) {

    const { error } = await supabase.from('posts').delete().eq('id', id);

    if (error) console.log(error);
    else setPosts((postsAnteriores) => postsAnteriores.filter(post => post.id !== id));
  }

  function editarPost(id, descricaoAtual) {
    setPostEditandoId(id);
    setDescricaoEditada(descricaoAtual);
    setMenuAberto(null); // Fecha o menu
  }

  async function salvarEdicao(id) {
    const { error } = await supabase
      .from("posts")
      .update({ descricao: descricaoEditada })
      .eq("id", id);

    if (error) {
      console.log(error);
    } else {
      setPosts((postsAnteriores) =>
        postsAnteriores.map((post) =>
          post.id === id ? { ...post, descricao: descricaoEditada } : post
        )
      );
      setPostEditandoId(null); // Fecha o modo edição
      setDescricaoEditada("");
    }
  }

  return (
    <div className="container">

      {!modoCriacaoAtivo ? (
        <button onClick={() => setModoCriacaoAtivo(true)} className="btn-criar-post">
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
                    <button onClick={() => editarPost(item.id, item.descricao)}>Editar</button>
                    <button onClick={() => deletarPost(item.id)}>Excluir</button>
                  </div>
                )}
              </div>
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
