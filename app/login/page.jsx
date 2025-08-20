'use client'

import { supabase } from "@/app/api/supabaseClient";
import { useState } from "react";
import { useRouter } from "next/navigation";
import "@/app/index.css";

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [username, setUsername] = useState('');
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [modoCadastro, setModoCadastro] = useState(false);
  const router = useRouter();

  async function signInWithEmail(e) {
    e.preventDefault();
    setCarregando(true);
    setErro(null);
    setSucesso(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    setCarregando(false);

    if (error) {
      setErro("Email ou senha inválidos");
    } else {
      router.push("/home");
    }
  }

  async function signUpNewUser(e) {
    e.preventDefault();
    setCarregando(true);
    setErro(null);
    setSucesso(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (error) {
      setErro("Erro ao cadastrar: " + error.message);
      setCarregando(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("usuarios")
      .insert([{
        email: email,
        senha: senha,
        username: username,
        nome: nome,
        sobrenome: sobrenome,
        data_nascimento: dataNascimento
      }]);

    setCarregando(false);

    if (insertError) {
      setErro("Usuário criado, mas falha ao salvar no banco: " + insertError.message);
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
    <div className="login-container">
      <h2 className="login-title">{modoCadastro ? "Cadastro" : "Login"}</h2>
      <form onSubmit={modoCadastro ? signUpNewUser : signInWithEmail} className="login-form">
        {modoCadastro && (
          <>
            <div className="form-group">
              <label>Nome:</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="input"
              />
            </div>
            <div className="form-group">
              <label>Sobrenome:</label>
              <input
                type="text"
                value={sobrenome}
                onChange={(e) => setSobrenome(e.target.value)}
                required
                className="input"
              />
            </div>
            <div className="form-group">
              <label>Nome de usuário:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="input"
              />
            </div>
            <div className="form-group">
              <label>Data de nascimento:</label>
              <input
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                required
                className="input"
              />
            </div>
          </>
        )}
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input"
          />
        </div>
        <div className="form-group">
          <label>Senha:</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            className="input"
          />
        </div>
        {erro && <p className="error-text">{erro}</p>}
        {sucesso && <p className="success-text">{sucesso}</p>}
        <button type="submit" disabled={carregando} className="button">
          {carregando ? "Processando..." : modoCadastro ? "Cadastrar" : "Entrar"}
        </button>
      </form>
      <p style={{ textAlign: "center", marginTop: "10px" }}>
        {modoCadastro ? "Já tem conta?" : "Não tem conta?"}{" "}
        <button onClick={() => setModoCadastro(!modoCadastro)} className="link-button">
          {modoCadastro ? "Fazer login" : "Criar conta"}
        </button>
      </p>
    </div>
  );
}
