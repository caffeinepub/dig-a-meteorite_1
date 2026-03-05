import MixinAuthorization "./authorization/MixinAuthorization";

actor class Backend() = this {
  // Minimal backend stub - all game state stored in localStorage

  public shared func _initializeAccessControlWithSecret(_secret : Text) : async () {};

  public query func ping() : async Text { "pong" };
}
