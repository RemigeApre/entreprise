<script setup lang="ts">
definePageMeta({ layout: 'public' })

useSeoMeta({
  title: 'Transparence financiere — Le Geai',
  description: 'La transparence financiere du groupe Le Geai — bientot disponible.'
})

const visible = ref(false)
onMounted(() => { requestAnimationFrame(() => { visible.value = true }) })
</script>

<template>
  <div class="transparence" :class="{ 'is-visible': visible }">
    <div class="transparence-container">

      <!-- Header -->
      <header class="tr-header">
        <span class="tr-numeral">IV</span>
        <h1 class="tr-title">Transparence</h1>
        <div class="tr-rule" />
      </header>

      <!-- Contenu a venir -->
      <div class="tr-body">
        <div class="tr-icon">
          <UIcon name="i-lucide-lock-open" class="size-8" />
        </div>

        <p class="tr-lead">Cette page est en preparation.</p>
        <p class="tr-text">Nous croyons qu'une entreprise qui demande la confiance de ses clients, de ses partenaires et de ses equipes doit rendre des comptes. Pas par obligation legale — par principe.</p>
        <p class="tr-text">Ici seront publies nos chiffres, nos revenus, nos charges, notre marge. En toute clarte. Sans intermediaire.</p>

        <div class="tr-note">
          <span class="tr-note-label">Disponible prochainement</span>
        </div>
      </div>

      <!-- Ornament -->
      <div class="end-ornament">
        <div class="end-line" />
        <span class="end-glyph">G</span>
        <div class="end-line" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.transparence {
  --gold: #AF8F3C;
  --gold-dim: rgba(175, 143, 60, 0.28);
  --gold-faint: rgba(175, 143, 60, 0.10);
  padding: clamp(20px, 4vw, 60px) clamp(24px, 5vw, 64px);
}

.transparence-container {
  max-width: 620px;
  margin: 0 auto;
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.8s ease 0.15s, transform 0.8s ease 0.15s;
}
.is-visible .transparence-container {
  opacity: 1;
  transform: translateY(0);
}

/* Header */
.tr-header {
  text-align: center;
  margin-bottom: clamp(48px, 8vh, 72px);
}

.tr-numeral {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-style: italic;
  font-size: 1.1rem;
  color: var(--gold);
  opacity: 0.5;
  display: block;
  margin-bottom: 12px;
}

.tr-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 400;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.tr-rule {
  width: 50px;
  height: 1px;
  margin: 0 auto;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
}

/* Body */
.tr-body {
  text-align: center;
  padding: clamp(32px, 6vh, 56px) 0;
}

.tr-icon {
  color: var(--gold);
  opacity: 0.3;
  margin-bottom: 28px;
}

.tr-lead {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-style: italic;
  font-size: 1.3rem;
  color: var(--gold);
  opacity: 0.7;
  margin-bottom: 24px;
}

.tr-text {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1.05rem;
  line-height: 2;
  opacity: 0.6;
  max-width: 500px;
  margin: 0 auto 16px;
  text-align: left;
}
.tr-text:last-of-type { margin-bottom: 0; }

.tr-note {
  margin-top: 40px;
  padding: 16px 24px;
  border: 1px solid var(--gold-faint);
  display: inline-block;
}

.tr-note-label {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.8rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gold);
  opacity: 0.5;
}

/* End ornament */
.end-ornament {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding-top: clamp(40px, 6vh, 60px);
  opacity: 0.3;
}
.end-line {
  width: 40px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
}
.end-glyph {
  font-family: 'UnifrakturCook', cursive;
  font-size: 1.2rem;
  color: var(--gold);
  line-height: 1;
}
</style>
