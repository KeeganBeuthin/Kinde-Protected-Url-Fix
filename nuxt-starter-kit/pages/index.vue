<template>
  <div class="container">
    <div class="card hero">
      <p class="text-display-1 hero-title">
        Let’s start authenticating <br>
        with Kinde
      </p>
      <p class="text-body-1 hero-tagline">
        Configure your app
      </p>

      <NuxtLink
        to="https://kinde.com/docs/sdks/nuxt-sdk"
        class="btn btn-light btn-big"
        external
      >
        Go to docs
      </NuxtLink>
    </div>

    <div class="test-links">
      <LoginLink to="/api/login" external>login</LoginLink>
      <RegisterLink to="/api/register" external>register</RegisterLink>

      <client-only>
        <LoginLink to="/api/login" external>login</LoginLink>
        <RegisterLink to="/api/register" external>register</RegisterLink>
      </client-only>

      <NuxtLink to="/dashboard">Go to Dashboard</NuxtLink>
    </div>
  </div>
</template>
