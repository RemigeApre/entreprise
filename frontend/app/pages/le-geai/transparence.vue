<script setup lang="ts">
definePageMeta({ layout: 'public' })

useSeoMeta({
  title: 'Transparence financiere — Le Geai',
  description: 'La transparence financiere du groupe Le Geai — nos comptes, en toute clarte.'
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

      <!-- Principe -->
      <section class="section">
        <div class="section-body">
          <p>Nous publions nos comptes. Pas dans le detail d'un bilan comptable, mais dans une forme lisible, honnete, accessible. Chiffre d'affaires, charges, resultat. Parce que la confiance ne se decrete pas, elle se prouve.</p>
          <p>Nous disons quand nous galerons. Nous disons quand nous injectons de l'argent personnel pour maintenir l'entreprise a flot. Nous disons quand nous sommes nuls en prospection. Le mensonge est plus couteux que la verite.</p>
        </div>
      </section>

      <!-- Ce qui sera publie -->
      <section class="section">
        <h2 class="section-heading">Ce qui sera publie</h2>
        <div class="items-grid">
          <div class="item-card">
            <span class="item-label">Chiffre d'affaires</span>
            <span class="item-desc">Revenu total, par branche</span>
          </div>
          <div class="item-card">
            <span class="item-label">Charges principales</span>
            <span class="item-desc">URSSAF, licences, serveurs</span>
          </div>
          <div class="item-card">
            <span class="item-label">Resultat net</span>
            <span class="item-desc">Ce qui reste, en toute clarte</span>
          </div>
          <div class="item-card">
            <span class="item-label">Salaires</span>
            <span class="item-desc">Accessibles aux employes via l'intranet</span>
          </div>
        </div>
      </section>

      <!-- Note -->
      <div class="tr-note">
        <UIcon name="i-lucide-lock-open" class="size-5 tr-note-icon" />
        <p>Cette page est en preparation. Les premiers chiffres seront publies prochainement, dans un tableau clair que n'importe qui comprend. Pas un bilan comptable — une preuve de confiance.</p>
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
  max-width: 660px;
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

/* Section */
.section {
  margin-bottom: clamp(40px, 6vh, 56px);
}

.section-heading {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.15rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gold);
  opacity: 0.8;
  margin-bottom: 24px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--gold-faint);
}

.section-body p {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1.05rem;
  line-height: 2;
  opacity: 0.7;
  margin-bottom: 16px;
}
.section-body p:last-child { margin-bottom: 0; }

/* Items grid */
.items-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.item-card {
  padding: 22px 20px;
  border: 1px solid var(--gold-faint);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-label {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1rem;
  letter-spacing: 0.04em;
}

.item-desc {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.8rem;
  opacity: 0.45;
  line-height: 1.5;
}

/* Note */
.tr-note {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  border: 1px solid var(--gold-faint);
  margin-top: clamp(16px, 3vh, 32px);
}

.tr-note-icon {
  color: var(--gold);
  opacity: 0.4;
  flex-shrink: 0;
  margin-top: 2px;
}

.tr-note p {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.92rem;
  line-height: 1.8;
  opacity: 0.55;
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

@media (max-width: 480px) {
  .items-grid { grid-template-columns: 1fr; }
}
</style>
