<script lang="ts">
  import type { RegionalEnergyData } from '../eia-api';
  import { showMoney } from '../utils';

  export let energyData: RegionalEnergyData | null = null;
  export let isLoading: boolean = true;
  export let hasError: boolean = false;
  export let errorMessage: string = '';
  export let currentEnergyCost: number;

  // Format the energy cost for display
  $: formattedEnergyRate = energyData?.averageResidentialRate
    ? showMoney(energyData.averageResidentialRate / 100)
    : 'N/A'; // Convert cents to dollars

  // Check if the current energy cost differs from the regional average
  $: isCurrentCostDifferent =
    energyData?.averageResidentialRate &&
    Math.abs(currentEnergyCost * 100 - energyData.averageResidentialRate) > 1; // Difference of more than 1 cent

  // Calculate the percent difference
  $: percentDifference = energyData?.averageResidentialRate
    ? Math.round(
        ((currentEnergyCost * 100 - energyData.averageResidentialRate) /
          energyData.averageResidentialRate) *
          100,
      )
    : 0;
</script>

<div
  class="bg-gray-800 bg-opacity-70 backdrop-blur-lg rounded-xl border border-gray-700 p-4 shadow-lg"
>
  <h3 class="text-lg font-semibold text-white flex items-center mb-3">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-5 w-5 mr-2 text-blue-400"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fill-rule="evenodd"
        d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
        clip-rule="evenodd"
      />
    </svg>
    Regional Energy Costs
  </h3>

  {#if isLoading}
    <div class="flex justify-center items-center h-24">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  {:else if hasError}
    <div class="text-red-400 text-sm">
      <p>Error loading energy data: {errorMessage}</p>
      <p class="mt-2">Using default energy cost for calculations.</p>
    </div>
  {:else if energyData}
    <div class="space-y-3 text-sm">
      <div class="flex justify-between">
        <span class="text-gray-300">Region:</span>
        <span class="text-white font-medium">{energyData.stateName || energyData.stateCode}</span>
      </div>

      <div class="flex justify-between">
        <span class="text-gray-300">Average Energy Cost:</span>
        <span class="text-white font-medium">{formattedEnergyRate}/kWh</span>
      </div>

      {#if energyData.residentialSourceInfo}
        <div class="text-xs text-gray-400 italic">
          Source: {energyData.residentialSourceInfo}
        </div>
      {/if}

      {#if isCurrentCostDifferent}
        <div class="mt-3 p-2 rounded bg-gray-700 bg-opacity-50">
          <p class="text-xs text-gray-300">
            Your current rate ({showMoney(currentEnergyCost)}/kWh) is {Math.abs(percentDifference)}%
            {percentDifference > 0 ? 'higher' : 'lower'} than the regional average.
          </p>
        </div>
      {/if}
    </div>
  {:else}
    <div class="text-gray-400 text-sm">No regional energy data available.</div>
  {/if}
</div>
