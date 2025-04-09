<template>
  <iframe class="search" :src="url" frameborder="0" width="100%" height="100vh "></iframe>
</template>

<script setup>
const url = import.meta.env.VITE_APP_SEARCH_API
</script>

<style>
.search {
  width: calc(100%);
  height: calc(100% - 60px);
}
</style>
