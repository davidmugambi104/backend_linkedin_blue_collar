import { axiosClient } from '@lib/axios';
import { ENDPOINTS } from '@config/endpoints';

export interface Location {
  lat: number;
  lng: number;
  timestamp?: string;
}

export interface NearbyJob {
  id: number;
  title: string;
  description: string;
  budget: number;
  location_lat?: number;
  location_lng?: number;
  distance_km: number;
  [key: string]: any;
}

export interface NearbyWorker {
  worker_id: number;
  distance_km: number;
  location: Location;
  [key: string]: any;
}

export interface JobMatch {
  worker_id: number;
  worker: any;
  match_score: number;
  distance_km: number;
  skill_proficiency?: string;
}

class LocationService {
  /**
   * Update worker's current location
   */
  async updateLocation(lat: number, lng: number): Promise<{ success: boolean; location: Location }> {
    return axiosClient.post(ENDPOINTS.LOCATION.UPDATE, { lat, lng });
  }

  /**
   * Get worker's current location
   */
  async getMyLocation(): Promise<Location> {
    return axiosClient.get(ENDPOINTS.LOCATION.MY_LOCATION);
  }

  /**
   * Get jobs near worker's location
   */
  async getNearbyJobs(radius = 10, limit = 20): Promise<{ jobs: NearbyJob[]; radius_km: number }> {
    return axiosClient.get(ENDPOINTS.LOCATION.NEARBY_JOBS, {
      params: { radius, limit },
    });
  }

  /**
   * Get workers near a location (for employers)
   */
  async getNearbyWorkers(
    lat: number,
    lng: number,
    radius = 10
  ): Promise<{ workers: NearbyWorker[]; count: number }> {
    return axiosClient.get(ENDPOINTS.LOCATION.NEARBY_WORKERS, {
      params: { lat, lng, radius },
    });
  }

  /**
   * Get matching workers for a specific job
   */
  async getJobMatches(
    jobId: number,
    radius = 50,
    limit = 20,
    minScore = 0.5
  ): Promise<{ job_id: number; matches: JobMatch[]; count: number }> {
    return axiosClient.get(ENDPOINTS.LOCATION.JOB_MATCHES(jobId), {
      params: { radius, limit, min_score: minScore },
    });
  }

  /**
   * Broadcast a new job to nearby workers (admin/employer)
   */
  async broadcastJob(jobId: number): Promise<{ success: boolean; message: string }> {
    return axiosClient.post(ENDPOINTS.LOCATION.BROADCAST_JOB(jobId));
  }
}

export const locationService = new LocationService();
