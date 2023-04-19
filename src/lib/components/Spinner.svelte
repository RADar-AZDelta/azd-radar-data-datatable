<!-- Copyright 2023 RADar-AZDelta -->
<!-- SPDX-License-Identifier: gpl3+ -->
<div class="spinner" />

<style>
  .spinner {
    --line-length: 8px;
    --line-offset: 4px;
    --line-width: 2px;
    --color-ring1: #0093d5;
    --color-ring2: #00a7a7;
    --gradient-circle: circle at 80% 20%, var(--color-ring2) 50%, var(--color-ring1) 50%;
    --gradient-lines: transparent calc(50% - var(--line-width) / 2),
      var(--color-background) calc(50% - var(--line-width) / 2 + 1px) calc(50% + var(--line-width) / 2 - 1px),
      transparent calc(50% + var(--line-width) / 2);
    --gradient-circle-mask: farthest-side, transparent calc(100% - var(--line-length)),
      var(--color-background) calc(100% - var(--line-length));
    --color-background: #fff;
  }

  .spinner {
    background: var(--color-background);
    margin: calc(var(--line-length) + var(--line-offset) + 0px);
    width: 10px;
    height: 10px;
    display: inline-block;
    border-radius: 50%;
    position: relative;
  }

  .spinner::after {
    content: '';
    position: absolute;
    top: calc(-1 * var(--line-length) - var(--line-offset));
    bottom: calc(-1 * var(--line-length) - var(--line-offset));
    left: calc(-1 * var(--line-length) - var(--line-offset));
    right: calc(-1 * var(--line-length) - var(--line-offset));
    border-radius: inherit;
    background: linear-gradient(-90deg, var(--gradient-lines)), linear-gradient(-75deg, var(--gradient-lines)),
      linear-gradient(-60deg, var(--gradient-lines)), linear-gradient(-45deg, var(--gradient-lines)),
      linear-gradient(-30deg, var(--gradient-lines)), linear-gradient(-15deg, var(--gradient-lines)),
      linear-gradient(0deg, var(--gradient-lines)), linear-gradient(15deg, var(--gradient-lines)),
      linear-gradient(30deg, var(--gradient-lines)), linear-gradient(45deg, var(--gradient-lines)),
      linear-gradient(60deg, var(--gradient-lines)), linear-gradient(75deg, var(--gradient-lines)),
      linear-gradient(90deg, var(--gradient-lines)), radial-gradient(var(--gradient-circle));
    mask: radial-gradient(var(--gradient-circle-mask));
    -webkit-mask: radial-gradient(var(--gradient-circle-mask));
    animation: spin 4s infinite linear;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(359deg);
    }
  }
</style>
