import { defineStore } from "pinia";
import {
  BaseBeverageType,
  CreamerType,
  SyrupType,
  BeverageType,
} from "../types/beverage";
import tempretures from "../data/tempretures.json";
import db from "../firebase.ts";
import { User } from "firebase/auth";
import {
  collection,
  getDocs,
  // addDoc,
  setDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";

export const useBeverageStore = defineStore("BeverageStore", {
  state: () => ({
    temps: tempretures,
    currentTemp: tempretures[0],
    bases: [] as BaseBeverageType[],
    currentBase: null as BaseBeverageType | null,
    syrups: [] as SyrupType[],
    currentSyrup: null as SyrupType | null,
    creamers: [] as CreamerType[],
    currentCreamer: null as CreamerType | null,
    user: null as User | null,
    beverages: [] as BeverageType[],
    currentBeverage: null as BeverageType | null,
    listenerUnsubscribe: null as (() => void) | null,
    currentName: "",
  }),

  actions: {
    async init() {
      try {
        // Load bases
        const basesSnap = await getDocs(collection(db, "bases"));
        this.bases = basesSnap.docs.map((d) => {
          const data = d.data() as any;
          return { id: d.id, name: data.name, color: data.color } as BaseBeverageType;
        });
        if (this.bases.length) this.currentBase = this.bases[0];

        // Load creamers
        const creamersSnap = await getDocs(collection(db, "creamers"));
        this.creamers = creamersSnap.docs.map((d) => {
          const data = d.data() as any;
          return { id: d.id, name: data.name, color: data.color } as CreamerType;
        });
        if (this.creamers.length) this.currentCreamer = this.creamers[0];

        // Load syrups
        const syrupsSnap = await getDocs(collection(db, "syrups"));
        this.syrups = syrupsSnap.docs.map((d) => {
          const data = d.data() as any;
          return { id: d.id, name: data.name, color: data.color } as SyrupType;
        });
        if (this.syrups.length) this.currentSyrup = this.syrups[0];

        // Listen for saved beverages (keeps list in sync)
        // Beverage listening is user-scoped. `setUser` will start a listener when a user signs in.
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error initializing beverage store:", err);
      }
    },

    async setUser(user: User | null) {
      try {
        // Stop previous listener if present
        if (this.listenerUnsubscribe) {
          try {
            this.listenerUnsubscribe();
          } catch (e) {
            // ignore
          }
          this.listenerUnsubscribe = null;
        }

        this.user = user;

        if (!user) {
          // Clear user-specific state
          this.beverages = [];
          this.currentBeverage = null;
          return;
        }

        // Start listening only to this user's beverages
        const bevQuery = query(
          collection(db, "beverages"),
          where("uid", "==", user.uid),
          orderBy("name")
        );

        this.listenerUnsubscribe = onSnapshot(bevQuery, (snapshot) => {
          this.beverages = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as BeverageType[];
          this.currentBeverage = this.beverages.length ? this.beverages[0] : null;
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error in setUser:", err);
      }
    },

    async makeBeverage() {
      try {
        if (!this.user) return "No user logged in, please sign in first.";
        if (!this.currentBase || !this.currentCreamer || !this.currentSyrup || !this.currentName)
          return "Please complete all beverage options and the name before making a beverage.";

        const id = `${this.user.uid}-${Date.now()}`;

        const payload = {
          uid: this.user.uid,
          name: this.currentName,
          temp: this.currentTemp,
          base: this.currentBase,
          syrup: this.currentSyrup,
          creamer: this.currentCreamer,
        };

        await setDoc(doc(db, "beverages", id), payload);

        // Update local state optimistically so UI responds immediately
        const newBev = { id, ...(payload as any) } as BeverageType;
        this.beverages = [newBev, ...this.beverages];
        this.currentBeverage = newBev;
        this.currentName = "";

        return `Beverage ${payload.name} made successfully!`;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error creating beverage:", err);
        return "Error creating beverage.";
      }
    },

    showBeverage(bev: BeverageType) {
      if (!bev) return;
      this.currentBeverage = bev;
      this.currentTemp = bev.temp;

      // Try to find matching items in loaded arrays, fallback to the beverage's embedded objects
      const foundBase = this.bases.find((b) => b.id === bev.base.id) || bev.base;
      const foundSyrup = this.syrups.find((s) => s.id === bev.syrup.id) || bev.syrup;
      const foundCreamer = this.creamers.find((c) => c.id === bev.creamer.id) || bev.creamer;

      this.currentBase = foundBase as BaseBeverageType;
      this.currentSyrup = foundSyrup as SyrupType;
      this.currentCreamer = foundCreamer as CreamerType;
    },
  },
});
