import { Component } from "@blitz-ts/Component";
import { ErrorManager } from "../Error";
import { getApiUrl } from "../../config/api";

interface ViewProfileProps {
  nickname?: string;
}

interface ViewProfileState {
  nickname: string;
  email: string;
  truncatedEmail: string;
  bio: string;
  profilePictureUrl: string;
  isCustomAvatar: boolean;
  isLoading: boolean;
  showError: boolean;
  errorMessage: string | null;
}

export class ViewProfileComponent extends Component<ViewProfileProps, ViewProfileState> {
  protected static state: ViewProfileState = {
    nickname: 'Unknown',
    email: '-',
    truncatedEmail: '-',
    bio: 'No bio available',
    profilePictureUrl: 'profile_no.svg',
    isCustomAvatar: false,
    isLoading: true,
    showError: false,
    errorMessage: null,
  };

  private lastLoadedNickname: string | null = null;

  constructor(props?: ViewProfileProps) {
    super(props || {});
  }

  protected async onMount(): Promise<void> {
    await this.ensureProfileLoaded();
    this.setupAddFriend();
  }

  private async ensureProfileLoaded(): Promise<void> {
    const targetNick = (this.getProps().nickname || '').trim();
    if (!targetNick) {
      this.showError('No nickname provided');
      this.setState({ isLoading: false });
      return;
    }

    if (this.lastLoadedNickname === targetNick && !this.state.isLoading) {
      return;
    }

    this.lastLoadedNickname = targetNick;
    await this.loadProfileByNickname(targetNick);
  }

  private showError(message: string) {
    this.setState({ showError: true, errorMessage: message });
    ErrorManager.showError(message, this.element, () => {
      this.setState({ showError: false, errorMessage: null });
    });
  }

  private async loadProfileByNickname(nickname: string): Promise<void> {
    try {
      this.setState({ isLoading: true });

      // Public endpoint list then filter (backend has no direct by-nickname route exposed)
      const resp = await fetch(getApiUrl('/profiles'), { credentials: 'include' });
      if (!resp.ok) {
        throw new Error(`Failed to fetch profiles (${resp.status})`);
      }
      const profiles = await resp.json();
      const profile = Array.isArray(profiles)
        ? profiles.find((p: any) => (p?.nickname || '').trim() === nickname)
        : null;

      if (!profile) {
        this.showError('Profile not found');
        this.setState({
          nickname: 'Unknown',
          email: '-',
          truncatedEmail: '-',
          bio: 'No bio available',
          profilePictureUrl: 'profile_no.svg',
          isLoading: false,
        });
        return;
      }

      // Build a fully-qualified image URL:
      // - Uploaded images come as '/uploads/...': use as-is
      // - Built-in avatars are filenames like 'profile_1.svg': prefix with '/art/profile/'
      // - Anything else defaults to built-in 'profile_no.svg'
      let profilePictureUrl = '/art/profile/profile_no.svg';
      let isCustomAvatar = false;
      if (typeof profile.profilePictureUrl === 'string' && profile.profilePictureUrl.trim() !== '') {
        const url = profile.profilePictureUrl as string;
        if (url.startsWith('/uploads/') || url.includes('/uploads/')) {
          profilePictureUrl = url;
          isCustomAvatar = true;
        } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
          const parts = url.split('/');
          const filename = parts[parts.length - 1] || 'profile_no.svg';
          profilePictureUrl = `/art/profile/${filename}`;
        } else {
          profilePictureUrl = '/art/profile/profile_no.svg';
        }
      }

      this.setState({
        nickname: profile.nickname && profile.nickname.trim() !== '' ? profile.nickname : 'Unknown',
        email: '-',
        truncatedEmail: '-',
        bio: profile.bio && profile.bio.trim() !== '' ? profile.bio : 'No bio available',
        profilePictureUrl,
        isCustomAvatar,
        isLoading: false,
      });
      this.updateProfileImageFit();
    } catch (e) {
      console.error('Error loading viewed profile:', e);
      this.showError('Failed to load profile');
      this.setState({ isLoading: false });
    }
  }

  render(): void {
    // reload if nickname prop changes
    this.ensureProfileLoaded();
  }

  private setupAddFriend(): void {
    this.addEventListener('#add-friend-btn', 'click', async (e) => {
      e.preventDefault();
      const targetNick = (this.getProps().nickname || '').trim();
      if (!targetNick) return;
      try {
        const resp = await fetch(getApiUrl('/friend/me'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ friend_nickname: targetNick }),
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          console.error('Add friend failed', err);
          const message = err?.message || err?.details || err?.error || `Request failed (${resp.status})`;
          this.showError(message);
          return;
        }
        this.showError('Friend request sent');
      } catch (err) {
        console.error('Add friend error', err);
        const message = err instanceof Error ? err.message : 'Failed to send friend request';
        this.showError(message);
      }
    });
  }

  private updateProfileImageFit(): void {
    try {
      const img = this.element.querySelector('#profile-picture') as HTMLElement | null;
      if (!img) return;
      const classList = img.classList;
      if (this.state.isCustomAvatar) {
        classList.remove('object-contain');
        if (!classList.contains('object-cover')) classList.add('object-cover');
      } else {
        classList.remove('object-cover');
        if (!classList.contains('object-contain')) classList.add('object-contain');
      }
    } catch {}
  }
}


