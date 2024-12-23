<template>
  <div>
    <h1>Dashboard (Protected Route)</h1>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth']
})
</script>
