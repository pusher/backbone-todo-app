class ListsController < ApplicationController
  def index
    @list = List.create!
    redirect_to show_list_path(:token => @list.token)
  end

  def show
    @list = List.find_by_token(params[:token])
    
    redirect_to :root if @list.nil?
  end

#  def destroy
#  end

end
