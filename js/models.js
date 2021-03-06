"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    // UNIMPLEMENTED: complete this function!
    return "hostname.com";
  }
}


/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, newStory) {

    const response = await axios({
      method: "POST",
      data: {
        'token': user.loginToken,
        'story': newStory,
      },
      url: `${BASE_URL}/stories`
    });

    return new Story (
      {storyId: response.data.story.storyId,
      title: response.data.story.title,
      author: response.data.story.author,
      url : response.data.story.url,
      username : response.data.story.username,
      createdAt : response.data.story.createdAt}
      );
  }
}




/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
                username,
                name,
                createdAt,
                favorites = [],
                ownStories = []
              },
              token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    });

    const { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    const { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      const { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }


  /** sends username,token,storyId to API to add a favorite  */

  async sendFavoriteStoryDataToAPI(user,storyId){
    const response = await axios({
      method: 'POST',
      url: `${BASE_URL}/users/${user.username}/favorites/${storyId}`,
      data : {'token': user.loginToken},
    });

    console.log(response, '===response')

    console.log(response.data.user.favorites.storyId, '===response data favoirte')

    console.log(storyId, '===sendfavoritestoryId')

    for (let story of storyList.stories) {
      console.log(story.storyId, '===forloopstoryid')
      if (story.storyId === storyId) {
        console.log('its adding a new story')
        user.favorites.push(story);
      }
    }
  }
  /** Clicking on a favorite will retrieve the selected storyId */

  async removeFavoriteStoryFromAPI(user, storyId){
    const response = await axios({
      method: 'DELETE',
      url: `${BASE_URL}/users/${user.username}/favorites/${storyId}`,
      data : { 'token': user.loginToken },
    })
    console.log(response, '===delete response')
    const favoriteStories = user.favorites;
    // console.log(favoriteStories[0])

    const newFavorites = favoriteStories.filter(story => {
      return story.storyId !== storyId;
    });

    console.log(newFavorites, '===newfavorites')
  }
}
// storyId, title, author, url, username, createdAt


$('.stories-list').on('click', '.star', (evt) => {

  const selectedStoryId = evt.currentTarget.parentNode.id;
  const $starTarget = $(evt.target);
  const $starTargetClassName =$($starTarget.className);


  $($starTarget[0]).toggleClass('fas far');
  console.log($starTarget[0])

  if (!$starTarget.hasClass('far')) {
    console.log('its gonna add')
    currentUser.sendFavoriteStoryDataToAPI(currentUser, selectedStoryId);
  } else {
    currentUser.removeFavoriteStoryFromAPI(currentUser, selectedStoryId);
  }
});