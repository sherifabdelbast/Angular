import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap, throwError } from 'rxjs';
import { Place } from './place.model';
import { ErrorService } from '../shared/error.service';

@Injectable({
  providedIn: 'root',
})
export class PlacesService {
  private httpClient = inject(HttpClient);
  private userPlaces = signal<Place[]>([]);
  private errorService = inject(ErrorService);
  loadedUserPlaces = this.userPlaces.asReadonly();

  loadAvailablePlaces() {
    return this.fetchPlaces(
      'https://8b1ce6b4-4b8f-4e52-aa20-30e89abdcf70-00-30fy5zpqqt6f6.janeway.replit.dev/places',
      'Something went wrong Fetching available places,Please Try Again Later'
    );
  }

  loadUserPlaces() {
    return this.fetchPlaces(
      'https://8b1ce6b4-4b8f-4e52-aa20-30e89abdcf70-00-30fy5zpqqt6f6.janeway.replit.dev/user-places',
      'Something went wrong,Please try again later.Fetching your Favourite places'
    ).pipe(
      tap({
        next: (userPlaces) => {
          this.userPlaces.set(userPlaces);
        },
      })
    );
  }

  addPlaceToUserPlaces(place: Place) {
    const prevPlaces = this.userPlaces();

    // Check if place already exists
    if (prevPlaces.some((p) => p.id === place.id)) {
      // Place already exists, show error and don't add
      this.errorService.showError(
        'This place has already been added to your collection!'
      );
      return throwError(() => new Error('Place already exists'));
    }

    // Add place if it doesn't exist
    this.userPlaces.set([...prevPlaces, place]);

    return this.httpClient
      .put<Place>(
        'https://8b1ce6b4-4b8f-4e52-aa20-30e89abdcf70-00-30fy5zpqqt6f6.janeway.replit.dev/user-places',
        {
          placeId: place.id,
        }
      )
      .pipe(
        catchError((error) => {
          this.userPlaces.set(prevPlaces);
          this.errorService.showError(
            'Something went wrong adding your favourite Place'
          );
          return throwError(
            () => new Error('Something went wrong adding your favourite Place')
          );
        })
      );
  }

  removeUserPlace(place: Place) {
    const prevPlaces = this.userPlaces();

    // Check if place exists before removing
    if (prevPlaces.some((p) => p.id === place.id)) {
      // Remove the place from the local state (optimistic update)
      this.userPlaces.set(prevPlaces.filter((p) => p.id !== place.id)); // Use !== to exclude the place
    } else {
      this.errorService.showError('Place not found in your collection!');
      return throwError(() => new Error('Place not found'));
    }

    return this.httpClient
      .delete<Place>(
        `https://8b1ce6b4-4b8f-4e52-aa20-30e89abdcf70-00-30fy5zpqqt6f6.janeway.replit.dev/user-places/${place.id}`
      )
      .pipe(
        catchError((error) => {
          // Restore previous state on error
          this.userPlaces.set(prevPlaces);
          this.errorService.showError('Failed to remove the selected place');
          return throwError(
            () => new Error('Failed to remove the selected place')
          );
        })
      );
  }

  private fetchPlaces(url: string, errorMessage: string) {
    return this.httpClient.get<{ places: Place[] }>(url).pipe(
      map((resData) => resData.places),
      catchError((error) => throwError(() => new Error(errorMessage)))
    );
  }
}
