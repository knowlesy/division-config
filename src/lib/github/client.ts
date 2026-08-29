export interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string;
}

export interface StoredBuildFile {
  name: string;
  path: string;
  sha: string;
  content?: string;
}

export class GitHubClient {
  private token: string;
  private apiBase: string = 'https://api.github.com';

  constructor(token: string) {
    this.token = token;
  }

  private async request(path: string, options: RequestInit = {}) {
    const res = await fetch(`${this.apiBase}${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.message || `GitHub API error: ${res.status} ${res.statusText}`);
    }

    return res.json();
  }

  async getUser(): Promise<GitHubUser> {
    return this.request('/user');
  }

  /**
   * Ensures the private repository 'my-division-builds' exists.
   * Explicitly sets private: true on creation.
   */
  async getOrCreateBuildsRepo(userLogin: string): Promise<string> {
    try {
      await this.request(`/repos/${userLogin}/my-division-builds`);
      return `my-division-builds`;
    } catch (e) {
      // Create repository as private
      await this.request('/user/repos', {
        method: 'POST',
        body: JSON.stringify({
          name: 'my-division-builds',
          private: true,
          auto_init: true,
          description: 'Personal Division 2 builds managed by Division Config'
        })
      });
      return 'my-division-builds';
    }
  }

  async listBuilds(userLogin: string): Promise<StoredBuildFile[]> {
    try {
      const contents = await this.request(`/repos/${userLogin}/my-division-builds/contents/builds`);
      if (!Array.isArray(contents)) return [];
      return contents.filter(f => f.name.endsWith('.json') || f.name.endsWith('.md'));
    } catch (e) {
      return [];
    }
  }

  async getBuildContent(userLogin: string, filePath: string): Promise<string> {
    const data = await this.request(`/repos/${userLogin}/my-division-builds/contents/${filePath}`);
    // GitHub contents API returns base64
    return decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
  }

  async saveBuild(
    userLogin: string,
    buildSlug: string,
    buildName: string,
    buildJson: string,
    existingSha?: string
  ): Promise<{ sha: string }> {
    const path = `builds/${buildSlug}.json`;
    const contentBase64 = btoa(unescape(encodeURIComponent(buildJson)));

    const body: any = {
      message: `Save build: ${buildName} [Division Config]`,
      content: contentBase64
    };

    if (existingSha) {
      body.sha = existingSha;
    }

    return this.request(`/repos/${userLogin}/my-division-builds/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  async deleteBuild(userLogin: string, filePath: string, sha: string): Promise<void> {
    await this.request(`/repos/${userLogin}/my-division-builds/contents/${filePath}`, {
      method: 'DELETE',
      body: JSON.stringify({
        message: `Delete build: ${filePath} [Division Config]`,
        sha
      })
    });
  }
}
