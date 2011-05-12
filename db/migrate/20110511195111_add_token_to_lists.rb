class AddTokenToLists < ActiveRecord::Migration
  def self.up
    add_column :lists, :token, :string
  end

  def self.down
    remove_column :lists, :token
  end
end
