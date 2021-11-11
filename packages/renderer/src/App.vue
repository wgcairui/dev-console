<template>
  <el-container class="home">
    <router-view />
  </el-container>
</template>


<style>
html,
body,
#app,
.home {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
}

.home {
  padding: 1rem;
  display: block !important
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.el-form-item__content{
  flex: none !important
}
</style>
