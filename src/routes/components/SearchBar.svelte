<!--
 Copyright 2023 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 -->

<script lang="ts">
  /* global google */

  import { onMount } from 'svelte';

  export let location: google.maps.LatLng | undefined;

  export let placesLibrary: google.maps.PlacesLibrary;
  export let map: google.maps.Map;
  export let initialValue = '';
  export let zoom = 19;

  let searchInput: HTMLInputElement;

  onMount(async () => {
    // Initialize autocomplete directly on our custom input
    const autocomplete = new placesLibrary.Autocomplete(searchInput, {
      fields: ['formatted_address', 'geometry', 'name'],
    });
    autocomplete.addListener('place_changed', async () => {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) {
        searchInput.value = '';
        return;
      }
      if (place.geometry.viewport) {
        map.setCenter(place.geometry.location);
        map.setZoom(zoom);
      } else {
        map.setCenter(place.geometry.location);
        map.setZoom(zoom);
      }

      location = place.geometry.location;
      if (place.name) {
        searchInput.value = place.name;
      } else if (place.formatted_address) {
        searchInput.value = place.formatted_address;
      }
    });
  });
</script>

<div class="search-container">
  <div class="search-bar">
    <div class="search-icon">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24"
        viewBox="0 0 24 24"
        width="24"
        fill="currentColor"
      >
        <path d="M0 0h24v24H0z" fill="none" />
        <path
          d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
        />
      </svg>
    </div>
    <input
      bind:this={searchInput}
      type="text"
      placeholder="Search an address..."
      value={initialValue}
      class="search-input"
    />
  </div>
</div>

<style>
  .search-container {
    position: absolute;
    top: 20px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    z-index: 1000;
    padding: 0 20px;
    animation: fadeIn 0.3s ease-out forwards;
  }

  .search-bar {
    display: flex;
    align-items: center;
    background: rgba(26, 26, 26, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);
    border-radius: 50px;
    padding: 12px 20px;
    width: 100%;
    max-width: 500px;
    transition: all 0.3s ease;
  }

  .search-bar:hover,
  .search-bar:focus-within {
    transform: scale(1.02);
    box-shadow: 0 10px 40px rgba(59, 130, 246, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .search-icon {
    color: rgba(255, 255, 255, 0.7);
    margin-right: 12px;
    display: flex;
    align-items: center;
  }

  .search-input {
    background: transparent;
    border: none;
    color: white;
    font-size: 16px;
    outline: none;
    width: 100%;
    font-family:
      'Inter',
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      Roboto,
      sans-serif;
    font-weight: 400;
    letter-spacing: 0.3px;
  }

  .search-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  /* Animation for better UX */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
