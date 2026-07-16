export interface PathRedirectMapping {
  readonly from: string;
  readonly to: string;
}

export interface PostSlugRedirectMapping {
  readonly from: string;
  readonly to: string;
}

export interface RedirectConfiguration {
  readonly paths: readonly PathRedirectMapping[];
  readonly postSlugs: readonly PostSlugRedirectMapping[];
}

export interface RedirectRule extends PathRedirectMapping {
  readonly status: 301;
}
