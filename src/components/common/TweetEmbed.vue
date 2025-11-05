<template>
  <div ref="tweetContainer" class="tweet-embed-container">
    <!-- Tweet will be rendered here by Twitter's script -->
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';

const props = defineProps({
  tweetUrl: {
    type: String,
    required: true,
  },
});

const tweetContainer = ref(null);

const createTweetEmbed = async () => {
  if (!props.tweetUrl || !tweetContainer.value) return;

  // Extract tweet ID from URL
  const match = props.tweetUrl.match(/status\/(\d+)/);
  const tweetId = match ? match[1] : null;

  if (!tweetId) {
    tweetContainer.value.innerHTML = '<p class="error-message">잘못된 트위터 주소입니다.</p>';
    return;
  }

  // Clear previous embed
  tweetContainer.value.innerHTML = '';

  try {
    // Check if Twitter's script is loaded
    if (window.twttr && window.twttr.widgets) {
      await window.twttr.widgets.createTweet(
        tweetId,
        tweetContainer.value,
        {
          theme: 'light', // or 'dark' based on app theme
          align: 'center',
        }
      );
    } else {
        // Fallback if script hasn't loaded for some reason
        const blockquote = document.createElement('blockquote');
        blockquote.className = 'twitter-tweet';
        blockquote.innerHTML = `<a href="${props.tweetUrl}"></a>`;
        tweetContainer.value.appendChild(blockquote);
        // The script in index.html should pick this up and render it
    }
  } catch (error) {
    console.error('Error creating tweet embed:', error);
    tweetContainer.value.innerHTML = '<p class="error-message">트위터 게시물을 불러오는 데 실패했습니다.</p>';
  }
};

onMounted(() => {
  // Ensure the twitter script is loaded before trying to render
  if (window.twttr) {
    createTweetEmbed();
  } else {
    // If the script is not loaded, wait for it.
    // This is a simple polling mechanism. A more robust solution might use a global event.
    const interval = setInterval(() => {
      if (window.twttr) {
        clearInterval(interval);
        createTweetEmbed();
      }
    }, 100);
  }
});

watch(() => props.tweetUrl, () => {
  nextTick(() => {
    createTweetEmbed();
  });
});
</script>

<style scoped>
.tweet-embed-container {
  display: flex;
  justify-content: center;
  margin: 1.5rem 0;
}
.error-message {
    color: rgb(var(--v-theme-error));
}
</style>
