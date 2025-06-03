/*
 Energy Information Administration (EIA) API service
 Provides access to electricity price and other energy data
*/

import axios from 'axios';

// EIA API Key
const EIA_API_KEY = import.meta.env.VITE_EIA_API_KEY || '8oXNeP8BxYNolzsxulnI9TWLMgSJPHE47ZfHwHhm';
const BASE_URL = 'https://api.eia.gov/v2';

export interface EiaResponse<T> {
  response: {
    total: number;
    data: T[];
  };
}

export interface ElectricityPriceData {
  period: string;
  areaName: string;
  stateDescription: string;
  value: number;
  units: string;
}

export interface RegionalEnergyData {
  stateCode: string;
  stateName: string;
  averageResidentialRate: number | null;
  averageCommercialRate: number | null;
  averageIndustrialRate: number | null;
  residentialSourceInfo: string | null;
  commercialSourceInfo: string | null;
  industrialSourceInfo: string | null;
  lastUpdated: string;
}

/**
 * Get the latest electricity price data for a specific state
 * @param stateCode The two-letter state code (e.g., 'CA' for California)
 * @returns Promise with electricity price data
 */
export async function getElectricityPricesByState(
  stateCode: string,
): Promise<ElectricityPriceData[]> {
  try {
    const response = await axios.get<EiaResponse<ElectricityPriceData>>(
      `${BASE_URL}/electricity/retail-sales/data`,
      {
        params: {
          api_key: EIA_API_KEY,
          frequency: 'monthly',
          data: 'price',
          facets: {
            sectorid: ['RES'], // Residential sector
            stateid: [stateCode],
          },
          sort: [{ column: 'period', direction: 'desc' }],
          offset: 0,
          length: 5,
        },
      },
    );

    return response.data.response.data;
  } catch (error) {
    console.error('Error fetching electricity prices:', error);
    throw error;
  }
}

/**
 * Convert a GoogleMaps LatLng object to a state code
 * @param location GoogleMaps LatLng object
 * @returns Promise with two-letter state code
 */
export async function getStateCodeFromLocation(location: google.maps.LatLng): Promise<string> {
  try {
    if (!location || typeof location.lat !== 'function' || typeof location.lng !== 'function') {
      throw new Error('Invalid location object provided');
    }

    console.log('Geocoding location:', location.lat(), location.lng());
    const geocoder = new google.maps.Geocoder();
    const response = await geocoder.geocode({ location });

    if (!response.results || response.results.length === 0) {
      throw new Error('No geocoding results found for this location');
    }

    // Find the state component
    for (const result of response.results) {
      for (const component of result.address_components) {
        if (component.types.includes('administrative_area_level_1')) {
          console.log('Found state:', component.short_name);
          return component.short_name;
        }
      }
    }

    throw new Error('No state information found in geocoding results');
  } catch (error) {
    console.error('Error getting state code from location:', error);
    throw error;
  }
}

/**
 * Get national average electricity price
 * @returns Promise with national average price data
 */
export async function getNationalAverageElectricityPrice(): Promise<ElectricityPriceData[]> {
  try {
    const response = await axios.get<EiaResponse<ElectricityPriceData>>(
      `${BASE_URL}/electricity/retail-sales/data`,
      {
        params: {
          api_key: EIA_API_KEY,
          frequency: 'monthly',
          data: 'price',
          facets: {
            sectorid: ['RES'], // Residential sector
            stateid: ['US'], // US average
          },
          sort: [{ column: 'period', direction: 'desc' }],
          offset: 0,
          length: 1,
        },
      },
    );

    return response.data.response.data;
  } catch (error) {
    console.error('Error fetching national average electricity price:', error);
    throw error;
  }
}

/**
 * Get comprehensive energy data for a region based on location
 * @param location GoogleMaps LatLng object
 * @returns Promise with regional energy data
 */
export async function getRegionalEnergyData(
  location: google.maps.LatLng,
): Promise<RegionalEnergyData> {
  try {
    console.log('Fetching energy data for location:', location.toString());

    // Get the state code from the location
    const stateCode = await getStateCodeFromLocation(location);
    console.log('Resolved state code:', stateCode);

    // Get state electricity price data
    const stateElectricityData = await getElectricityPricesByState(stateCode);
    console.log('Received electricity data:', stateElectricityData);

    // Get national average for comparison
    // const nationalData = await getNationalAverageElectricityPrice();

    // Extract the latest residential rate
    const residentialRate = stateElectricityData.length > 0 ? stateElectricityData[0].value : null;
    const stateName =
      stateElectricityData.length > 0 ? stateElectricityData[0].stateDescription : '';
    const sourceInfo =
      stateElectricityData.length > 0 ? `EIA data for ${stateElectricityData[0].period}` : null;

    console.log('Processed energy data:', {
      stateCode,
      stateName,
      residentialRate,
      sourceInfo,
    });

    return {
      stateCode,
      stateName,
      averageResidentialRate: residentialRate,
      averageCommercialRate: null,
      averageIndustrialRate: null,
      residentialSourceInfo: sourceInfo,
      commercialSourceInfo: null,
      industrialSourceInfo: null,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting regional energy data:', error);
    throw error; // Re-throw to be handled by the component
  }
}
