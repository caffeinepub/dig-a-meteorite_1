import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Initialize the user system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState); 
  
  public type UserProfile = {
    name : Text;
    // Other user metadata if needed
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Write additional application-specific code here.
  // Guard public functions as follows:
  // * Admin-only:
  //   if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
  //      Runtime.trap("Unauthorized: Only admins can perform this action");
  //   };
  // * Users only:
  //   if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
  //      Runtime.trap("Unauthorized: Only users can perform this action");
  //   };
  // * Any user including guests: No check needed
};
