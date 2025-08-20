"use client";

import React, { useState, useEffect } from 'react';
import styles from './UserProfile.module.css';
import { supabase } from '../../api/supabaseClient';

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState('posts');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [postsCount, setPostsCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      setUser(session.user);

      // Pega dados do perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, avatar_url, banner_url, bio')
        .eq('id', session.user.id)
        .single();
      if (!profileError) setProfile(profileData);

      // Conta posts do usuário
      const { count: postsCountResult, error: postsError } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id);
      if (postsError) console.error('Erro ao contar posts:', postsError);
      else setPostsCount(postsCountResult);

      // Conta curtidas do usuário
      const { count: likesCountResult, error: likesError } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);
      if (likesError) console.error('Erro ao contar likes:', likesError);
      else setLikesCount(likesCountResult);
    };

    fetchUserData();
  }, []);

  const handleEditProfile = () => {
    window.location.href = '/edit-profile';
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.bannerAndProfile}>
        <div className={styles.bannerContainer}>
          <img
            src={profile?.banner_url || "/images/banner.jpg"}
            alt="Banner de perfil"
            className={styles.bannerImage}
          />
        </div>

        <div className={styles.profileHeader}>
          <div className={styles.avatarSection}>
            <img
              src={profile?.avatar_url || "/images/user.png"}
              alt="Foto de perfil"
              className={styles.avatarPreview}
            />
          </div>
          <div className={styles.userInfo}>
            <h1 className={styles.userName}>
              {profile?.username || user?.email || "Usuário"}
            </h1>
            <p className={styles.profileDescription}>
              {profile?.bio || "Adicione aqui sua descrição."}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.profileActions}>
        <button className={styles.publishButton}>Publicar</button>
        <button className={styles.editButton} onClick={handleEditProfile}>
          Editar Perfil
        </button>
      </div>

      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === 'posts' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts ({postsCount})
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'likes' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('likes')}
        >
          Curtidas ({likesCount})
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'posts' && (
          <p className={styles.emptyMessage}>
            {postsCount === 0 ? "Nenhum post publicado." : `Você tem ${postsCount} post(s) publicado(s).`}
          </p>
        )}
        {activeTab === 'likes' && (
          <p className={styles.emptyMessage}>Coming Soon...</p>
        )}
      </div>
    </div>
  );
}
