import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts/router";
import { authService } from "../../lib/auth";
import { getApiUrl } from "../../config/api";


interface ProfileComponentState {
  nickname: string;
  email: string;
  truncatedEmail: string;
  bio: string;
  profilePictureUrl: string;
  isLoading: boolean;
  showError: boolean;
  errorMessage: string | null;
}

export class ProfileComponent extends Component<ProfileComponentState> {
  protected static state: ProfileComponentState = {
    nickname: 'Unknown',
    email: 'Unknown',
    truncatedEmail: 'Unknown',
    bio: 'No bio available',
    profilePictureUrl: 'profile_no.svg',
    isLoading: true,
    showError: false,
    errorMessage: null
  };

  private hasLoadedData: boolean = false; // Track if we've already loaded data

  constructor() {
    super();
    console.log('ProfileComponent constructor called');
  }

  private showError(message: string) {
    this.setState({
      showError: true,
      errorMessage: message
    });
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
      this.setState({
        showError: false,
        errorMessage: null
      });
    }, 5000);
  }

  protected onMount(): void {
    // Only load data if we haven't loaded it before or if we're in a loading state
    if (!this.hasLoadedData || this.state.isLoading) {
      console.log('ProfileComponent: Loading profile data');
      this.loadProfileData();
    } else {
      console.log('ProfileComponent: Skipping data load, already loaded');
    }
    this.setupEventListeners();
  }

  protected onUnmount(): void {
    // Don't reset the flag when unmounting to prevent reloading on remount
    // Only reset if we're actually changing users or there's an error
    console.log('ProfileComponent: onUnmount called');
  }

  // Method to reset the data load flag (call this when user changes)
  public resetDataLoad(): void {
    this.hasLoadedData = false;
    console.log('ProfileComponent: Data load flag reset');
  }

  private truncateEmail(email: string): string {
    if (email.length <= 18) {
      return email;
    }
    return email.substring(0, 15) + '...';
  }

  private setupEventListeners(): void {
    this.addEventListener("button", "click", () => {
      console.log('Settings button clicked!');
      const router = Router.getInstance();
      console.log('Router instance:', router);
      router.navigate('/user/settings');
    });

    // Add hover event listeners for email tooltip
    this.addEventListener("#email-display", "mouseenter", (e) => {
      const emailElement = e.target as HTMLElement;
      const fullEmail = this.state.email;
      if (fullEmail.length > 17) {
        emailElement.title = fullEmail;
      }
    });

    // Add click handler for profile picture
    this.addEventListener("#profile-picture", "click", () => {
      console.log('Profile picture clicked!');
      this.showPictureSelector();
    });

    // Profile picture selection buttons
    for (let i = 1; i <= 5; i++) {
      this.addEventListener(`#profile-option-${i}`, "click", () => {
        const pictureName = i === 5 ? 'profile_no.svg' : `profile_${i}.svg`;
        this.selectProfilePicture(pictureName);
      });
    }

    // Close button for picture selector
    this.addEventListener("#profile-selector-close", "click", () => {
      this.hidePictureSelector();
    });
  }

  private showPictureSelector(): void {
    const profileComponent = this.element.querySelector('#profile-component') as HTMLElement;
    const pictureSelector = this.element.querySelector('#profile-picture-selector') as HTMLElement;
    
    if (profileComponent && pictureSelector) {
      profileComponent.style.display = 'none';
      pictureSelector.style.display = 'flex';
    }
  }

  private hidePictureSelector(): void {
    const profileComponent = this.element.querySelector('#profile-component') as HTMLElement;
    const pictureSelector = this.element.querySelector('#profile-picture-selector') as HTMLElement;
    
    if (profileComponent && pictureSelector) {
      profileComponent.style.display = 'flex';
      pictureSelector.style.display = 'none';
    }
  }

  private async selectProfilePicture(pictureName: string): Promise<void> {
    try {
      console.log('Selecting profile picture:', pictureName);
      
      // Get current profile data
      const response = await authService.authenticatedFetch(getApiUrl('/profiles/me'));
      if (!response.ok) {
        throw new Error('Failed to get profile data');
      }
      
      const profileData = await response.json();
      
      // Update the profile picture using just the filename
      const updateResponse = await authService.authenticatedFetch(getApiUrl(`/profiles/${profileData.id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profilePictureUrl: pictureName }),
      });
      
      if (updateResponse.ok) {
        console.log('Profile picture updated successfully');
        this.setState({ profilePictureUrl: pictureName });
        this.hidePictureSelector();
      } else {
        const errorData = await updateResponse.json();
        console.error('Failed to update profile picture:', errorData);
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
    }
  }

  private async loadProfileData(): Promise<void> {
    try {
      // Get email from auth service
      const currentUser = authService.getCurrentUser();
      const email = currentUser?.email || 'Unknown';
      const truncatedEmail = this.truncateEmail(email);
      
      console.log('ProfileComponent: Current user:', currentUser);
      console.log('ProfileComponent: Auth token exists:', !!authService.getToken());

      // Get profile data from API
      const response = await authService.authenticatedFetch(getApiUrl('/profiles/me'));
      
      console.log('ProfileComponent: Response status:', response.status);
      
      if (!response.ok) {
        console.error('ProfileComponent: Profile fetch failed with status:', response.status);
        if (response.status === 401) {
          // Token expired, redirect to login
          this.showError('Your session has expired. Please log in again.');
          const { Router } = await import('@blitz-ts/router');
          Router.getInstance().navigate('/');
          return;
        }
              this.setState({
        nickname: 'Unknown',
        email: email,
        truncatedEmail: truncatedEmail,
        bio: 'No bio available',
        profilePictureUrl: 'profile_no.svg',
        isLoading: false,
        error: null
      });
      
      this.hasLoadedData = true; // Mark that we've loaded the data even in error case
        return;
      }

      const profileData = await response.json();
      
      // Extract just the filename from the full URL for display
      let profilePictureUrl = 'profile_no.svg';
      if (profileData.profilePictureUrl) {
        console.log('ProfileComponent: Processing profilePictureUrl:', profileData.profilePictureUrl);
        if (profileData.profilePictureUrl.startsWith('http://') || 
            profileData.profilePictureUrl.startsWith('https://') ||
            profileData.profilePictureUrl.startsWith('javascript:') ||
            profileData.profilePictureUrl.startsWith('data:') ||
            profileData.profilePictureUrl.includes('<') ||
            profileData.profilePictureUrl.includes('>')) {
          // External URL or dangerous content - use default profile picture
          console.log('ProfileComponent: External URL or dangerous content detected, using default profile picture');
          profilePictureUrl = 'profile_no.svg';
        } else {
          const urlParts = profileData.profilePictureUrl.split('/');
          const filename = urlParts[urlParts.length - 1];
          // Only allow safe filename characters
          if (/^[a-zA-Z0-9_.-]+\.(svg|png|jpg|jpeg|gif)$/.test(filename)) {
            profilePictureUrl = filename;
          } else {
            profilePictureUrl = 'profile_no.svg';
          }
          console.log('ProfileComponent: Using local filename:', profilePictureUrl);
        }
      }
      
      this.setState({
        nickname: profileData.nickname && profileData.nickname.trim() !== '' ? profileData.nickname : 'Unknown',
        email: email,
        truncatedEmail: truncatedEmail,
        bio: profileData.bio && profileData.bio.trim() !== '' ? profileData.bio : 'No bio available',
        profilePictureUrl: profilePictureUrl,
        isLoading: false,
        error: null
      });
      
      this.hasLoadedData = true; // Mark that we've loaded the data

    } catch (error) {
      console.error('Error loading profile data:', error);
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        this.showError('Your session has expired. Please log in again.');
        const { Router } = await import('@blitz-ts/router');
        Router.getInstance().navigate('/');
        return;
      }
      const currentUser = authService.getCurrentUser();
      const email = currentUser?.email || 'Unknown';
      const truncatedEmail = this.truncateEmail(email);
      
      this.setState({
        nickname: 'Unknown',
        email: email,
        truncatedEmail: truncatedEmail,
        bio: 'No bio available',
        profilePictureUrl: 'profile_no.svg',
        isLoading: false,
        error: null
      });
      
      this.hasLoadedData = true; // Mark that we've loaded the data even in error case
    }
  }
    
  render() {}
}