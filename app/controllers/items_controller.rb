class ItemsController < ApplicationController
  before_filter :get_list

  def index
    render :json => @list.items
  end

  def create
    item = @list.items.create!({
      :shortdesc => params[:shortdesc],
      :isdone => params[:isdone]
    })
    
    render :json => item
  end

  def show
    item = @list.items.find(params[:id])
    render :json => item
  end

  def update
    item = @list.items.find(params[:id])
    item.update_attributes!({
      :shortdesc => params[:shortdesc],
      :isdone => params[:isdone]
    })
    
    render :json => item
  end

  def destroy
    @list.items.find(params[:id]).destroy
    render :json => {}
  end

  private
  def get_list
    @list = List.find_by_token(params[:token])
  end
end
