'use client';

import React, { useState, useEffect } from "react";
import InputField from "../../components/InputField/InputField.jsx";
import Button from "../../components/Button/Button.jsx";
import { FaEnvelope, FaLock, FaUser, FaBirthdayCake } from "react-icons/fa";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import styles from "./login.module.css";
import { supabase } from "@/api/supabaseClient";
import { useRouter } from "next/navigation";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [username, setUsername] = useState("");
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modoCadastro, setModoCadastro] = useState(false);

  const router = useRouter();

  const handleScrollToNextSection = () => {
    const mainContent = document.querySelector(`.${styles.mainContent}`);
    if (mainContent) {
      mainContent.scrollBy({ top: window.innerHeight, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const aboutSection = document.querySelector(`.${styles.aboutSection}`);
    if (!aboutSection) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const aboutTitle = aboutSection.querySelector(`.${styles.aboutTitle}`);
          const aboutText = aboutSection.querySelector(`.${styles.aboutText}`);
          if (entry.isIntersecting) {
            aboutTitle?.classList.add(styles.aboutVisible);
            aboutText?.classList.add(styles.aboutVisible);
          } else {
            aboutTitle?.classList.remove(styles.aboutVisible);
            aboutText?.classList.remove(styles.aboutVisible);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(aboutSection);
    return () => observer.unobserve(aboutSection);
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    setSucesso(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    setLoading(false);

    if (error) {
      setErro("Email ou senha inválidos");
    } else {
      router.push("/home");
    }
  }

  async function handleCadastro(e) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    setSucesso(null);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (authError) {
      setErro("Erro ao cadastrar: " + authError.message);
      setLoading(false);
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      setErro("Não foi possível criar o usuário.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("profiles")
      .insert([{
        id: userId,
        email,
        username: username || `${nome}_${sobrenome}`.toLowerCase(),
        nome,
        sobrenome,
        data_nascimento: dataNascimento,
        avatar_url: "",
        banner_url: "",
        bio: ""
      }]);

    setLoading(false);

    if (insertError) {
      setErro("Usuário criado no Auth, mas falha ao salvar no profile: " + insertError.message);
    } else {
      setSucesso("Cadastro realizado com sucesso!");
      setModoCadastro(false);
      setEmail("");
      setSenha("");
      setUsername("");
      setNome("");
      setSobrenome("");
      setDataNascimento("");
    }
  }



  return (
    <>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <img src="/images/logo.png" alt="VirAll Logo" className={styles.topBarLogo} />
          <span className={styles.topBarText}>VirAll</span>
        </div>
        <div className={styles.topBarRight}>
          <button type="button" className={styles.botaoSobre} onClick={handleScrollToNextSection}>Sobre</button>
          <button type="button" className={styles.botaoEntrar} onClick={() => setModoCadastro(false)}>Entrar</button>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={`${styles.loginPage} ${styles.contentWithTopBar}`}>
          <button className={styles.downArrow} onClick={handleScrollToNextSection} aria-label="Scroll para a próxima seção">
            <FiChevronDown size={30} />
          </button>

          <div className={styles.leftSection}>
            <h1 className={styles.leftTitle}>
              Compartilhe,<br />aprenda,<br />transforme.
            </h1>
            <Button className={styles.startButtonAdjusted} onClick={() => setModoCadastro(true)}>
              Comece já! <FiChevronRight />
            </Button>
          </div>

          <div className={modoCadastro ? styles.registerPage : styles.loginContainer}>
            <div className={styles.logoSection}>
              <img src="/images/logo.png" alt="VirAll Logo" className={styles.logoImage} />
              <h1 className={styles.logoText}>
                {modoCadastro ? "Cadastre-se no VirAll" : "Bem vindo(a) ao VirAll"}
              </h1>
              {modoCadastro && <p className={styles.formSubtitle}>Preencha os dados para criar sua conta</p>}
            </div>

            <form onSubmit={modoCadastro ? handleCadastro : handleLogin} className={modoCadastro ? styles.registerForm : styles.loginForm}>
              {modoCadastro && (
                <>
                  <InputField icon={FaUser} type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
                  <InputField icon={FaUser} type="text" placeholder="Sobrenome" value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} />
                  <InputField icon={FaUser} type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                  <InputField icon={FaBirthdayCake} type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} />
                </>
              )}
              <InputField icon={FaEnvelope} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <InputField icon={FaLock} type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} />

              {erro && <p className={styles.errorMessage}>{erro}</p>}
              {sucesso && <p className={styles.successText}>{sucesso}</p>}

              <Button type="submit" disabled={loading}>
                {loading ? (modoCadastro ? "Processando..." : "Entrando...") : (modoCadastro ? "Cadastrar" : "Entrar")}
              </Button>
            </form>

            <p style={{ marginTop: "15px" }}>
              {modoCadastro ? "Já tem conta?" : "Não tem uma conta?"}{" "}
              <span
                className={styles.registerLink}
                onClick={() => setModoCadastro(!modoCadastro)}
                style={{ cursor: "pointer" }}
              >
                {modoCadastro ? "Fazer login" : "Cadastre-se"}
              </span>
            </p>
          </div>
        </div>

        <div className={styles.aboutSection}>
          <div className={styles.aboutContainer}>
            <div className={styles.aboutTextContainer}>
              <h2 className={styles.aboutTitle}>O que é o<br />VirAll?</h2>
              <p className={styles.aboutText}>
                O VirAll é uma plataforma inovadora que conecta alunos e professores da área da saúde, facilitando a troca de conhecimento em um ambiente colaborativo e acessível. <br /><br />
                Aqui, você pode: <br /><br />
                • Tirar dúvidas e conversar com especialistas e colegas.<br />
                • Compartilhar informações e experiências de forma rápida e prática.<br />
                • Publicar e acessar artigos atualizados para aprofundar seus estudos.<br />
                • Ficar por dentro das últimas novidades do setor da saúde.<br /><br />
                Seja você um estudante buscando ajuda, um professor disposto a compartilhar seu conhecimento, ou alguém interessado em se manter informado, o VirAll é o lugar ideal para aprender, ensinar e crescer junto com uma comunidade engajada e apaixonada pela saúde.
              </p>
            </div>
            <div className={styles.aboutImageContainer}>
              <div className={`${styles.destaqueImagens} ${styles.trianguloImagens}`}>
                <div className={`${styles.imgWrapper} ${styles.imgTriangulo1}`}>
                  <img src="/images/morango.jpg" alt="Saúde e bem-estar" />
                </div>
                <div className={`${styles.imgWrapper} ${styles.imgTriangulo2}`}>
                  <img src="/images/salada.jpg" alt="Alimentação saudável" />
                </div>
                <div className={`${styles.imgWrapper} ${styles.imgTriangulo3}`}>
                  <img src="/images/medico.jpg" alt="Estilo de vida saudável" />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

export default LoginPage;
