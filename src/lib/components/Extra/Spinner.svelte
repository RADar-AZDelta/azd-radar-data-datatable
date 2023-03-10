<div class="spinner-container">
  <div class="circle" />
</div>

<style>
  .circle {
    height: 60px;
    width: 60px;
    border-color: gray transparent gray gray;
    border-width: 5px;
    border-style: solid;
    border-image: initial;
    border-radius: 50%;
    animation: 1s linear 0s infinite normal none running rotate;
  }
  @keyframes rotate {
    0% {
      transform: rotate(0);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
