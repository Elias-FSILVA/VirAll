'use client';

import React, { useState, useEffect } from "react";
import InputField from "@/components/InputField/InputField";
import Button from "@/components/Button/Button";
import { FaLock, FaPhone, FaUserCircle, FaPencilAlt, FaInfoCircle, FaAddressBook } from "react-icons/fa";
import styles from "./editprofile.module.css";
import { useRouter } from "next/navigation";
import { supabase } from "@/api/supabaseClient";

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [showAvatarOverlay, setShowAvatarOverlay] = useState(false);
  const [showBannerOverlay, setShowBannerOverlay] = useState(false);
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/home");

      setUser(session.user);
      setAvatarUrl(session.user.user_metadata?.avatar_url || "");
      setBannerUrl(session.user.user_metadata?.banner_url || "");
      setUsername(session.user.user_metadata?.username || "");
      setPhone(session.user.user_metadata?.phone || "");
      setDescription(session.user.user_metadata?.bio || "");
    };
    getUser();
  }, [router]);

  if (!user) return <p>Carregando...</p>;

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}_${type}.${fileExt}`;
    const filePath = `${type}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("user-files")
      .upload(filePath, file, { upsert: true });

    if (uploadError) return alert("Erro ao enviar arquivo: " + uploadError.message);

    // Corrigido: usar data.publicUrl
    const { data } = supabase.storage.from("user-files").getPublicUrl(filePath);
    if (type === "avatar") setAvatarUrl(data.publicUrl);
    else setBannerUrl(data.publicUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password && password !== confirmPassword) {
      setError("Senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      // Atualiza user_metadata (opcional)
      await supabase.auth.updateUser({
        password: password || undefined,
        data: {
          username,
          phone,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
          bio: description
        }
      });

      // Upsert na tabela profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            username,
            phone,
            avatar_url: avatarUrl,
            banner_url: bannerUrl,
            bio: description
          },
          { onConflict: 'id' }
        );

      if (profileError) throw profileError;

      alert("Perfil atualizado com sucesso!");
      router.push("/userprofile");
    } catch (err) {
      console.error(err);
      setError("Erro ao atualizar perfil.");
    }

    setLoading(false);
  };

  return (
    <div className={styles.registerContainer}>
      <h1 className={styles.mainTitle}>Editar Perfil</h1>
      <p className={styles.subtitle}>Modifique suas informações abaixo.</p>

      <div className={styles.profileHeader}>
        {/* Banner */}
        <div
          className={styles.bannerContainer}
          style={{ backgroundImage: `url(${bannerUrl})` }}
          onClick={() => setShowBannerOverlay(true)}
        />
        {/* Avatar */}
        <label className={styles.avatarLabel}>
          <div className={styles.avatarWrapper} onClick={() => setShowAvatarOverlay(true)}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className={styles.avatarPreview} />
            ) : (
              <FaUserCircle size={120} color="#8FC6BB" />
            )}
            <div className={styles.avatarEditIcon}>
              <FaPencilAlt size={20} color="#fff" />
            </div>
          </div>
        </label>
      </div>

      {/* Modais de upload */}
      {showAvatarOverlay && (
        <div className={styles.avatarOverlay} onClick={() => setShowAvatarOverlay(false)}>
          <div className={styles.avatarModal} onClick={(e) => e.stopPropagation()}>
            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e.target.files[0], "avatar")} />
          </div>
        </div>
      )}

      {showBannerOverlay && (
        <div className={styles.avatarOverlay} onClick={() => setShowBannerOverlay(false)}>
          <div className={styles.bannerModal} onClick={(e) => e.stopPropagation()}>
            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e.target.files[0], "banner")} />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.registerForm}>
        <InputField
          icon={FaAddressBook}
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <InputField
          icon={FaPhone}
          type="tel"
          placeholder="Telefone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <div className={styles.inputField}>
          <span className={styles.inputIcon}><FaInfoCircle /></span>
          <textarea
            className={styles.textareaField}
            placeholder="Descrição do Perfil"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>

        <InputField
          icon={FaLock}
          type="password"
          placeholder="Nova Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <InputField
          icon={FaLock}
          type="password"
          placeholder="Confirmar Senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && <p className={styles.errorText}>{error}</p>}
        <div className={styles.buttonContainer}>
          <Button type="submit" disabled={loading} className={styles.saveButton}>
            {loading ? "Atualizando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
