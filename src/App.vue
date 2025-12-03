<template>
  <div>
    <header class="auth-header">
      <div v-if="!beverageStore.user">
        <button class="auth-btn" @click="withGoogle">Sign in with Google</button>
      </div>
      <div v-else class="signed-in">
        <span class="user-name">{{ beverageStore.user.displayName || beverageStore.user.email }}</span>
        <button class="auth-btn" @click="doSignOut">Sign out</button>
      </div>
      <div v-if="message" class="auth-message">{{ message }}</div>
    </header>

    <Beverage :isIced="beverageStore.currentTemp === 'Cold'" />
    <ul>
      <li>
        <template v-for="temp in beverageStore.temps" :key="temp">
          <label>
            <input
              type="radio"
              name="temperature"
              :id="`r${temp}`"
              :value="temp"
              v-model="beverageStore.currentTemp"
            />
            {{ temp }}
          </label>
        </template>
      </li>
    </ul>
    <ul>
      <li>
        <template v-for="b in beverageStore.bases" :key="b.id">
          <label>
            <input
              type="radio"
              name="bases"
              :id="`r${b.id}`"
              :value="b"
              v-model="beverageStore.currentBase"
            />
            {{ b.name }}
          </label>
        </template>
      </li>
    </ul>
    <ul>
      <li>
        <template v-for="s in beverageStore.syrups" :key="s.id">
          <label>
            <input
              type="radio"
              name="syrups"
              :id="`r${s.id}`"
              :value="s"
              v-model="beverageStore.currentSyrup"
            />
            {{ s.name }}
          </label>
        </template>
      </li>
    </ul>
    <ul>
      <li>
        <template v-for="c in beverageStore.creamers" :key="c.id">
          <label>
            <input
              type="radio"
              name="creamers"
              :id="`r${c.id}`"
              :value="c"
              v-model="beverageStore.currentCreamer"
            />
            {{ c.name }}
          </label>
        </template>
      </li>
    </ul>
    <input type="text" placeholder="Beverage Name" v-model="beverageStore.currentName" />
    <button :disabled="!beverageStore.user" @click="makeBeverage">🍺 Make Beverage</button>
  </div>

    <div id="beverage-container" style="margin-top: 20px">
      <ul>
        <li v-for="b in beverageStore.beverages" :key="b.id">
          <label>
            <input
              type="radio"
              name="saved"
              :id="`bev-${b.id}`"
              :value="b"
              v-model="beverageStore.currentBeverage"
              @change="beverageStore.showBeverage(b)"
            />
            {{ b.name }}
          </label>
        </li>
      </ul>
    </div>
</template>

<script setup lang="ts">
import Beverage from "./components/Beverage.vue";
import { useBeverageStore } from "./stores/beverageStore";
import { onMounted, ref } from "vue";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "./firebase";

const beverageStore = useBeverageStore();
const message = ref("");

async function withGoogle() {
  message.value = "";
  try {
    await signInWithPopup(auth, googleProvider);
    // onAuthStateChanged will call setUser in the store
  } catch (err: any) {
    message.value = err?.message || "Error signing in";
  }
}

async function doSignOut() {
  message.value = "";
  try {
    await signOut(auth);
    // store will be updated via onAuthStateChanged
  } catch (err: any) {
    message.value = err?.message || "Error signing out";
  }
}

async function makeBeverage() {
  message.value = "";
  const res = await beverageStore.makeBeverage();
  if (res) message.value = res as string;
}

onMounted(async () => {
  await beverageStore.init();
  onAuthStateChanged(auth, (u) => {
    beverageStore.setUser(u as any);
  });
});
</script>

<style lang="scss">
body,
html {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: #6e4228;
  background: linear-gradient(to bottom, #6e4228 0%, #956f5a 100%);
}
ul {
  list-style: none;
}

.auth-header {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
}

.auth-message {
  margin-left: 8px;
}

.user-name {
  font-weight: 600;
}
</style>
