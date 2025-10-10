"use client";
import { supabase } from "../../api/supabaseClient";
import { useEffect, useState } from "react";
import styles from "./home.module.css";
import UserProfile from "../userprofile/page.jsx";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [arquivo, setArquivo] = useState(null);
  const [modoCriacaoAtivo, setModoCriacaoAtivo] = useState(false);
  const [postEditandoId, setPostEditandoId] = useState(null);
  const [descricaoEditada, setDescricaoEditada] = useState("");
  const [user, setUser] = useState(null);
  const [signedUrls, setSignedUrls] = useState({});
  const [conteudoAtivo, setConteudoAtivo] = useState("feed");
  const [news, setNews] = useState([]);
  const [noticiaAtiva, setNoticiaAtiva] = useState(null);
  const NEWS_API_KEY = "2da842732868404189739503525ad8b6";

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  useEffect(() => {
    if (conteudoAtivo === "news") {
      async function fetchNews() {
        try {
          const res = await fetch(`https://newsapi.org/v2/top-headlines?country=us&category=health&apiKey=${NEWS_API_KEY}`);
          const data = await res.json();
          setNews(data.articles || []);
        } catch (err) {
          console.error("Erro ao carregar notícias:", err);
        }
      }
      fetchNews();
    }
  }, [conteudoAtivo]);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  useEffect(() => {
    async function carregaPosts() {
      const { data, error } = await supabase
        .from("posts")
        .select(`*, post_likes(*), post_comments(*)`)
        .order("id", { ascending: false });

      if (!error) {
        setPosts(data);
        gerarSignedUrls(data);
      }
    }
    carregaPosts();

    const postsChannel = supabase
      .channel("posts-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, payload => {
        if (payload.eventType === "INSERT") {
          setPosts(prev => [payload.new, ...prev]);
          if (payload.new.attachment_url) gerarSignedUrls([payload.new]);
        } else if (payload.eventType === "UPDATE") {
          setPosts(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p));
        } else if (payload.eventType === "DELETE") {
          setPosts(prev => prev.filter(p => p.id !== payload.old.id));
          setSignedUrls(prev => {
            const copy = { ...prev };
            delete copy[payload.old.id];
            return copy;
          });
        }
      })
      .subscribe();

    const likesChannel = supabase
      .channel("likes-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "post_likes" }, payload => {
        setPosts(prev =>
          prev.map(post => {
            if (post.id === payload.new?.post_id || post.id === payload.old?.post_id) {
              const likes = post.post_likes || [];
              if (payload.eventType === "INSERT") return { ...post, post_likes: [...likes, payload.new] };
              if (payload.eventType === "DELETE") return { ...post, post_likes: likes.filter(l => l.id !== payload.old.id) };
            }
            return post;
          })
        );
      })
      .subscribe();

    const commentsChannel = supabase
      .channel("comments-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "post_comments" }, payload => {
        setPosts(prev =>
          prev.map(post => {
            if (post.id === payload.new?.post_id || post.id === payload.old?.post_id) {
              const comments = post.post_comments || [];
              if (payload.eventType === "INSERT") return { ...post, post_comments: [...comments, payload.new] };
              if (payload.eventType === "DELETE") return { ...post, post_comments: comments.filter(c => c.id !== payload.old.id) };
            }
            return post;
          })
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, []);

  async function gerarSignedUrls(postsArray) {
    const newUrls = {};
    for (let post of postsArray) {
      if (post.attachment_url) {
        const { data, error } = await supabase.storage
          .from('post_files')
          .createSignedUrl(post.attachment_url, 60 * 60);
        if (!error) newUrls[post.id] = data.signedUrl;
      }
    }
    setSignedUrls(prev => ({ ...prev, ...newUrls }));
  }

  async function uploadArquivo(file) {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('post_files').upload(fileName, file, { upsert: true });
    if (error) return null;
    return fileName;
  }

  async function inserirPost(e) {
    e.preventDefault();
    if (!novoTitulo.trim() && !novaDescricao.trim() && !arquivo) return;

    let arquivoPath = null;
    if (arquivo) arquivoPath = await uploadArquivo(arquivo);

    const { data, error } = await supabase.from("posts").insert([{
      titulo: novoTitulo,
      descricao: novaDescricao,
      user_id: user?.id,
      attachment_url: arquivoPath
    }]).select();

    if (!error) {
      setPosts(prev => [data[0], ...prev]);
      if (arquivoPath) gerarSignedUrls([data[0]]);
    }

    setNovoTitulo("");
    setNovaDescricao("");
    setArquivo(null);
    setModoCriacaoAtivo(false);
  }

  async function deletarPost(id) {
    const { error } = await supabase.from("posts").delete().eq("id", id).select();
    if (!error) setPosts(prev => prev.filter(p => p.id !== id));
  }

  function editarPost(id, descricaoAtual) {
    setPostEditandoId(id);
    setDescricaoEditada(descricaoAtual);
  }

  async function salvarEdicao(id) {
    const { data, error } = await supabase
      .from("posts")
      .update({ descricao: descricaoEditada })
      .eq("id", id)
      .select();
    if (!error) {
      setPosts(prev => prev.map(post => post.id === id ? data[0] : post));
      setPostEditandoId(null);
      setDescricaoEditada("");
    }
  }

  async function toggleLike(postId) {
    const { data: jaCurtiu } = await supabase
      .from("post_likes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single();

    if (jaCurtiu) await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
    else await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
  }

  async function adicionarComentario(postId, texto) {
    if (!texto.trim()) return;
    await supabase.from("post_comments").insert({ post_id: postId, user_id: user.id, comentario: texto });
  }

  return (
  <div className={styles.container}>
    <aside className={styles.sidebar}>
      <h3>VirAll</h3>
      <ul>
        <li onClick={() => setConteudoAtivo("feed")}>Feed</li>
        <li onClick={() => setConteudoAtivo("news")}>Notícias</li>
        <li onClick={() => setConteudoAtivo("perfil")}>Meu Perfil</li>
        <li onClick={handleLogout}>Sair</li>
      </ul>
    </aside>

    <main className={styles.feed}>
      {conteudoAtivo === "feed" && (
        <>
          {!modoCriacaoAtivo ? (
            <button onClick={() => setModoCriacaoAtivo(true)} className={styles.btnCriarPost}>
              Criar Post
            </button>
          ) : (
            <form onSubmit={inserirPost} className={styles.formulario}>
              <input placeholder="Título (opcional)" value={novoTitulo} onChange={e => setNovoTitulo(e.target.value)} />
              <textarea placeholder="Descrição..." value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)} />
              <input type="file" accept=".jpg,.jpeg,.png,.pdf,.docx,.txt" onChange={e => setArquivo(e.target.files[0])} />
              <button type="submit">Publicar</button>
              <button type="button" onClick={() => setModoCriacaoAtivo(false)}>Cancelar</button>
            </form>
          )}

          <ul className={styles.listaPosts}>
            {posts.map(post => (
              <li key={post.id} className={styles.cardPost}>
                <h2>{post.titulo}</h2>

                {postEditandoId === post.id ? (
                  <>
                    <textarea value={descricaoEditada} onChange={e => setDescricaoEditada(e.target.value)} />
                    <button onClick={() => salvarEdicao(post.id)}>Salvar</button>
                    <button onClick={() => setPostEditandoId(null)}>Cancelar</button>
                  </>
                ) : (
                  <p>{post.descricao}</p>
                )}

                {post.attachment_url && signedUrls[post.id] && (
                  <div className={styles.postArquivo}>
                    <a href={signedUrls[post.id]} target="_blank" rel="noopener noreferrer">📎 Ver arquivo</a>
                    {(post.attachment_url.endsWith(".png") ||
                      post.attachment_url.endsWith(".jpg") ||
                      post.attachment_url.endsWith(".jpeg")) && (
                        <img src={signedUrls[post.id]} alt="Anexo" />
                      )}
                  </div>
                )}

                {user?.id === post.user_id && (
                  <div className={styles.menuContainer}>
                    <button onClick={() => editarPost(post.id, post.descricao)}>Editar</button>
                    <button onClick={() => deletarPost(post.id)}>Excluir</button>
                  </div>
                )}

                <div className={styles.postFooter}>
                  <div className={styles.postActions}>
                    <button onClick={() => toggleLike(post.id)} className={styles.likeBtn}>
                      {post.post_likes?.some(l => l.user_id === user?.id) ? "💖" : "🤍"} {post.post_likes?.length || 0}
                    </button>
                  </div>

                  <ul className={styles.commentList}>
                    {post.post_comments?.map(c => (
                      <li key={c.id}>{c.comentario}</li>
                    ))}
                  </ul>

                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      const input = e.target.elements.comentario;
                      adicionarComentario(post.id, input.value);
                      input.value = "";
                    }}
                    className={styles.commentForm}
                  >
                    <input name="comentario" placeholder="Escreva um comentário..." />
                    <button type="submit">Comentar</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {conteudoAtivo === "news" && (
        <>
          <ul className={styles.listaPosts}>
            {news.map((article, idx) => (
              <li key={idx} className={styles.cardPost} onClick={() => setNoticiaAtiva(article)}>
                {article.urlToImage && <img src={article.urlToImage} alt={article.title} style={{ maxHeight: "200px", objectFit: "cover" }} />}
                <h2>{article.title}</h2>
                <p>{article.description}</p>
              </li>
            ))}
          </ul>

          {noticiaAtiva && (
            <div className={styles.modalNoticia}>
              <button onClick={() => setNoticiaAtiva(null)} className={styles.fecharModal}>X</button>
              {noticiaAtiva.urlToImage && <img src={noticiaAtiva.urlToImage} alt={noticiaAtiva.title} />}
              <h2>{noticiaAtiva.title}</h2>
              <p>{noticiaAtiva.content || noticiaAtiva.description}</p>
              <a href={noticiaAtiva.url} target="_blank" rel="noopener noreferrer">Leia no site original</a>
            </div>
          )}
        </>
      )}

      {conteudoAtivo === "perfil" && <UserProfile />}
    </main>
  </div>
);
}
