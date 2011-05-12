Todos::Application.routes.draw do
  root :to => "lists#index"
  get ":token" => "lists#show", :as => :show_list
  # delete ":token/destroy" => "list#destroy", :as => :destroy_list

  scope ":token", :as => "list" do
    resources :items, :except => [:new, :edit]
  end
end
